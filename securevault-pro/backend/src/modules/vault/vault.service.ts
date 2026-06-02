import crypto from 'crypto';
import { prisma } from '../../config/database';
import { encrypt, decrypt } from '../../config/encryption';
import { comparePassword } from '../../utils/password';
import { assessPasswordStrength } from '../../utils/password';
import { AppError } from '../../utils/AppError';
import { buildPaginationMeta } from '../../utils/response';
import { createActivityLog } from '../../middleware/activityLogger.middleware';
import type { CreateVaultEntryInput, UpdateVaultEntryInput, ListVaultQuery } from './vault.dto';
import { Prisma, EmailProvider, ImportanceLevel } from '@prisma/client';

/* ── Safe projection (never returns encrypted fields) ─────────────────── */

const SAFE = {
  id: true,
  userId: true,
  title: true,
  platformName: true,
  provider: true,
  platformUrl: true,
  emailAddress: true,
  username: true,
  category: true,
  importanceLevel: true,
  isFavorite: true,
  archivedAt: true,
  passwordStrength: true,
  twoFactorEnabled: true,
  authenticatorApp: true,
  recoveryEmail: true,
  recoveryPhone: true,
  lastPasswordChangedAt: true,
  nextPasswordReminderAt: true,
  lastAccessedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  // presence flags for encrypted sensitive fields (bool, not content)
  hasBackupCodes:       true,
  hasAppPasswords:      true,
  hasSecurityQuestions: true,
  hasNotes:             true,
  tags: { select: { name: true } },
} as const;

/* Helper: encrypt a string, return { ciphertext, iv, tag } */
function enc(value: string | undefined | null) {
  if (!value) return {};
  const r = encrypt(value);
  return { ciphertext: r.ciphertext, iv: r.iv, tag: r.tag };
}

/* Helper: build presence-flag from nullable ciphertext */
function presenceFlags(entry: {
  encryptedBackupCodes: string | null;
  encryptedAppPasswords: string | null;
  encryptedSecurityQuestions: string | null;
  encryptedNotes: string | null;
}) {
  return {
    hasBackupCodes:       !!entry.encryptedBackupCodes,
    hasAppPasswords:      !!entry.encryptedAppPasswords,
    hasSecurityQuestions: !!entry.encryptedSecurityQuestions,
    hasNotes:             !!entry.encryptedNotes,
  };
}

export class VaultService {

  /* ── CREATE ──────────────────────────────────────────────────────────── */

  async createEntry(userId: string, dto: CreateVaultEntryInput, ipAddress?: string) {
    const pwdEnc  = enc(dto.password);
    const strength = assessPasswordStrength(dto.password).score;

    const notesEnc      = enc(dto.notes);
    const bcEnc         = enc(dto.backupCodes);
    const apEnc         = enc(dto.appPasswords);
    const sqEnc         = enc(dto.securityQuestions);

    const entry = await prisma.vaultEntry.create({
      data: {
        userId,
        title:            dto.title,
        platformName:     dto.platformName,
        provider:         dto.provider as EmailProvider ?? 'CUSTOM',
        platformUrl:      dto.platformUrl || null,
        emailAddress:     dto.emailAddress,
        username:         dto.username || null,

        encryptedPassword: pwdEnc.ciphertext!,
        encryptionIv:      pwdEnc.iv!,
        encryptionTag:     pwdEnc.tag!,

        encryptedNotes:  notesEnc.ciphertext ?? null,
        notesIv:         notesEnc.iv         ?? null,
        notesTag:        notesEnc.tag         ?? null,

        recoveryEmail:   dto.recoveryEmail   || null,
        recoveryPhone:   dto.recoveryPhone   || null,

        twoFactorEnabled: dto.twoFactorEnabled ?? false,
        authenticatorApp: dto.authenticatorApp || null,

        encryptedBackupCodes:        bcEnc.ciphertext ?? null,
        backupCodesIv:               bcEnc.iv         ?? null,
        backupCodesTag:              bcEnc.tag         ?? null,

        encryptedAppPasswords:       apEnc.ciphertext ?? null,
        appPasswordsIv:              apEnc.iv         ?? null,
        appPasswordsTag:             apEnc.tag         ?? null,

        encryptedSecurityQuestions:  sqEnc.ciphertext ?? null,
        securityQuestionsIv:         sqEnc.iv         ?? null,
        securityQuestionsTag:        sqEnc.tag         ?? null,

        category:        dto.category || null,
        importanceLevel: dto.importanceLevel as ImportanceLevel ?? 'MEDIUM',
        isFavorite:      dto.isFavorite ?? false,
        passwordStrength: strength,

        lastPasswordChangedAt:  dto.lastPasswordChangedAt  ? new Date(dto.lastPasswordChangedAt)  : new Date(),
        nextPasswordReminderAt: dto.nextPasswordReminderAt ? new Date(dto.nextPasswordReminderAt) : null,

        tags: dto.tags?.length
          ? { create: dto.tags.map((name) => ({ name: name.toLowerCase() })) }
          : undefined,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        platformName: true,
        provider: true,
        platformUrl: true,
        emailAddress: true,
        username: true,
        category: true,
        importanceLevel: true,
        isFavorite: true,
        archivedAt: true,
        passwordStrength: true,
        twoFactorEnabled: true,
        authenticatorApp: true,
        recoveryEmail: true,
        recoveryPhone: true,
        lastPasswordChangedAt: true,
        nextPasswordReminderAt: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true,
        encryptedBackupCodes: true,
        encryptedAppPasswords: true,
        encryptedSecurityQuestions: true,
        encryptedNotes: true,
        tags: { select: { name: true } },
      },
    });

    const result = {
      ...entry,
      ...presenceFlags(entry),
      encryptedBackupCodes: undefined,
      encryptedAppPasswords: undefined,
      encryptedSecurityQuestions: undefined,
      encryptedNotes: undefined,
    };

    await createActivityLog({ userId, action: 'VAULT_CREATE', resource: 'VaultEntry', resourceId: entry.id, ipAddress });
    return result;
  }

  /* ── LIST ────────────────────────────────────────────────────────────── */

  async listEntries(userId: string, query: ListVaultQuery) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Prisma.VaultEntryWhereInput = { userId };

    // Archived filter (default = not archived)
    if (query.archived) {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    if (query.search) {
      where.OR = [
        { title:         { contains: query.search, mode: 'insensitive' } },
        { platformName:  { contains: query.search, mode: 'insensitive' } },
        { emailAddress:  { contains: query.search, mode: 'insensitive' } },
        { username:      { contains: query.search, mode: 'insensitive' } },
        { category:      { contains: query.search, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    if (query.provider)   where.provider   = query.provider as EmailProvider;
    if (query.category)   where.category   = { contains: query.category, mode: 'insensitive' };
    if (query.importance) where.importanceLevel = query.importance as ImportanceLevel;
    if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

    // Password health filters
    if (query.health === 'weak') {
      where.passwordStrength = { lt: 40 };
    } else if (query.health === 'old') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      where.lastPasswordChangedAt = { lt: ninetyDaysAgo };
    } else if (query.health === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.nextPasswordReminderAt = { lte: thirtyDaysFromNow };
    }

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder ?? 'desc' }
      : { importanceLevel: 'asc' as const, updatedAt: 'desc' as const };

    const rawSelect = {
      id: true, userId: true, title: true, platformName: true, provider: true,
      platformUrl: true, emailAddress: true, username: true, category: true,
      importanceLevel: true, isFavorite: true, archivedAt: true, passwordStrength: true,
      twoFactorEnabled: true, authenticatorApp: true, recoveryEmail: true, recoveryPhone: true,
      lastPasswordChangedAt: true, nextPasswordReminderAt: true, lastAccessedAt: true,
      createdAt: true, updatedAt: true,
      encryptedBackupCodes: true, encryptedAppPasswords: true, encryptedSecurityQuestions: true, encryptedNotes: true,
      tags: { select: { name: true } },
    };

    const [rawEntries, total] = await prisma.$transaction([
      prisma.vaultEntry.findMany({ where, select: rawSelect, skip, take: limit, orderBy }),
      prisma.vaultEntry.count({ where }),
    ]);

    const entries = rawEntries.map((e) => ({
      ...e,
      ...presenceFlags(e),
      encryptedBackupCodes: undefined,
      encryptedAppPasswords: undefined,
      encryptedSecurityQuestions: undefined,
      encryptedNotes: undefined,
    }));

    return { entries, meta: buildPaginationMeta(total, page, limit) };
  }

  /* ── GET SINGLE ──────────────────────────────────────────────────────── */

  async getEntry(id: string, userId: string) {
    const raw = await prisma.vaultEntry.findFirst({
      where: { id, userId },
      select: {
        id: true, userId: true, title: true, platformName: true, provider: true,
        platformUrl: true, emailAddress: true, username: true, category: true,
        importanceLevel: true, isFavorite: true, archivedAt: true, passwordStrength: true,
        twoFactorEnabled: true, authenticatorApp: true, recoveryEmail: true, recoveryPhone: true,
        lastPasswordChangedAt: true, nextPasswordReminderAt: true, lastAccessedAt: true,
        expiresAt: true, createdAt: true, updatedAt: true,
        encryptedBackupCodes: true, encryptedAppPasswords: true, encryptedSecurityQuestions: true, encryptedNotes: true,
        tags: { select: { name: true } },
      },
    });

    if (!raw) throw new AppError('Vault entry not found', 404, 'VAULT_NOT_FOUND');

    return {
      ...raw,
      ...presenceFlags(raw),
      encryptedBackupCodes: undefined,
      encryptedAppPasswords: undefined,
      encryptedSecurityQuestions: undefined,
      encryptedNotes: undefined,
    };
  }

  /* ── REVEAL (single encrypted field) ────────────────────────────────── */

  async revealField(
    id: string,
    userId: string,
    masterPassword: string,
    field: string,
    ipAddress?: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { masterPasswordHash: true },
    });

    if (!user?.masterPasswordHash) {
      throw new AppError('Master password not set — configure it in security settings', 400, 'MASTER_PASSWORD_NOT_SET');
    }

    const isValid = await comparePassword(masterPassword, user.masterPasswordHash);
    if (!isValid) {
      await createActivityLog({ userId, action: 'PASSWORD_VIEW', resource: 'VaultEntry', resourceId: id, success: false, errorMessage: 'Invalid master password', ipAddress });
      throw new AppError('Invalid master password', 401, 'INVALID_MASTER_PASSWORD');
    }

    const entry = await prisma.vaultEntry.findFirst({
      where: { id, userId },
      select: {
        encryptedPassword: true, encryptionIv: true, encryptionTag: true,
        encryptedNotes: true, notesIv: true, notesTag: true,
        encryptedBackupCodes: true, backupCodesIv: true, backupCodesTag: true,
        encryptedAppPasswords: true, appPasswordsIv: true, appPasswordsTag: true,
        encryptedSecurityQuestions: true, securityQuestionsIv: true, securityQuestionsTag: true,
      },
    });

    if (!entry) throw new AppError('Vault entry not found', 404, 'VAULT_NOT_FOUND');

    let decrypted: string | null = null;

    switch (field) {
      case 'password':
        decrypted = decrypt({ ciphertext: entry.encryptedPassword, iv: entry.encryptionIv, tag: entry.encryptionTag });
        break;
      case 'notes':
        if (entry.encryptedNotes && entry.notesIv && entry.notesTag)
          decrypted = decrypt({ ciphertext: entry.encryptedNotes, iv: entry.notesIv, tag: entry.notesTag });
        break;
      case 'backupCodes':
        if (entry.encryptedBackupCodes && entry.backupCodesIv && entry.backupCodesTag)
          decrypted = decrypt({ ciphertext: entry.encryptedBackupCodes, iv: entry.backupCodesIv, tag: entry.backupCodesTag });
        break;
      case 'appPasswords':
        if (entry.encryptedAppPasswords && entry.appPasswordsIv && entry.appPasswordsTag)
          decrypted = decrypt({ ciphertext: entry.encryptedAppPasswords, iv: entry.appPasswordsIv, tag: entry.appPasswordsTag });
        break;
      case 'securityQuestions':
        if (entry.encryptedSecurityQuestions && entry.securityQuestionsIv && entry.securityQuestionsTag)
          decrypted = decrypt({ ciphertext: entry.encryptedSecurityQuestions, iv: entry.securityQuestionsIv, tag: entry.securityQuestionsTag });
        break;
    }

    // Update last accessed
    await prisma.vaultEntry.update({ where: { id }, data: { lastAccessedAt: new Date() } });

    const action = field === 'password' ? 'PASSWORD_VIEW' :
                   field === 'backupCodes' ? 'BACKUP_CODES_VIEW' :
                   field === 'appPasswords' ? 'APP_PASSWORDS_VIEW' :
                   field === 'securityQuestions' ? 'SECURITY_QUESTIONS_VIEW' : 'PASSWORD_VIEW';

    await createActivityLog({ userId, action: action as any, resource: 'VaultEntry', resourceId: id, ipAddress });

    return { field, value: decrypted };
  }

  /* ── UPDATE ──────────────────────────────────────────────────────────── */

  async updateEntry(id: string, userId: string, dto: UpdateVaultEntryInput, ipAddress?: string) {
    await this.getEntry(id, userId);

    const updateData: Prisma.VaultEntryUpdateInput = {};

    if (dto.title        !== undefined) updateData.title        = dto.title;
    if (dto.platformName !== undefined) updateData.platformName = dto.platformName;
    if (dto.provider     !== undefined) updateData.provider     = dto.provider as EmailProvider;
    if (dto.platformUrl  !== undefined) updateData.platformUrl  = dto.platformUrl || null;
    if (dto.emailAddress !== undefined) updateData.emailAddress = dto.emailAddress;
    if (dto.username     !== undefined) updateData.username     = dto.username || null;
    if (dto.category     !== undefined) updateData.category     = dto.category || null;
    if (dto.importanceLevel !== undefined) updateData.importanceLevel = dto.importanceLevel as ImportanceLevel;
    if (dto.isFavorite   !== undefined) updateData.isFavorite   = dto.isFavorite;
    if (dto.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = dto.twoFactorEnabled;
    if (dto.authenticatorApp !== undefined) updateData.authenticatorApp = dto.authenticatorApp || null;
    if (dto.recoveryEmail    !== undefined) updateData.recoveryEmail    = dto.recoveryEmail    || null;
    if (dto.recoveryPhone    !== undefined) updateData.recoveryPhone    = dto.recoveryPhone    || null;
    if (dto.archivedAt !== undefined) updateData.archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : null;
    if (dto.lastPasswordChangedAt  !== undefined) updateData.lastPasswordChangedAt  = dto.lastPasswordChangedAt  ? new Date(dto.lastPasswordChangedAt)  : null;
    if (dto.nextPasswordReminderAt !== undefined) updateData.nextPasswordReminderAt = dto.nextPasswordReminderAt ? new Date(dto.nextPasswordReminderAt) : null;

    if (dto.password) {
      const { ciphertext, iv, tag } = encrypt(dto.password);
      updateData.encryptedPassword  = ciphertext;
      updateData.encryptionIv       = iv;
      updateData.encryptionTag      = tag;
      updateData.passwordStrength   = assessPasswordStrength(dto.password).score;
      updateData.lastPasswordChangedAt = new Date();
    }

    // Encrypt optional sensitive fields
    const encryptField = (
      val: string | undefined,
      cField: string, ivField: string, tagField: string,
    ) => {
      if (val === undefined) return;
      if (val) {
        const r = encrypt(val);
        (updateData as any)[cField]  = r.ciphertext;
        (updateData as any)[ivField] = r.iv;
        (updateData as any)[tagField]= r.tag;
      } else {
        (updateData as any)[cField]  = null;
        (updateData as any)[ivField] = null;
        (updateData as any)[tagField]= null;
      }
    };

    encryptField(dto.notes,            'encryptedNotes',             'notesIv',              'notesTag');
    encryptField(dto.backupCodes,      'encryptedBackupCodes',       'backupCodesIv',        'backupCodesTag');
    encryptField(dto.appPasswords,     'encryptedAppPasswords',      'appPasswordsIv',       'appPasswordsTag');
    encryptField(dto.securityQuestions,'encryptedSecurityQuestions', 'securityQuestionsIv',  'securityQuestionsTag');

    if (dto.tags !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: dto.tags.map((name) => ({ name: name.toLowerCase() })),
      };
    }

    const updated = await prisma.vaultEntry.update({
      where: { id },
      data: updateData,
      select: {
        id: true, title: true, platformName: true, provider: true, emailAddress: true, username: true,
        category: true, importanceLevel: true, isFavorite: true, archivedAt: true, passwordStrength: true,
        twoFactorEnabled: true, authenticatorApp: true, recoveryEmail: true, recoveryPhone: true,
        lastPasswordChangedAt: true, nextPasswordReminderAt: true, updatedAt: true,
        encryptedBackupCodes: true, encryptedAppPasswords: true, encryptedSecurityQuestions: true, encryptedNotes: true,
        tags: { select: { name: true } },
      },
    });

    await createActivityLog({ userId, action: 'VAULT_UPDATE', resource: 'VaultEntry', resourceId: id, ipAddress });

    return {
      ...updated,
      ...presenceFlags(updated),
      encryptedBackupCodes: undefined,
      encryptedAppPasswords: undefined,
      encryptedSecurityQuestions: undefined,
      encryptedNotes: undefined,
    };
  }

  /* ── DELETE ──────────────────────────────────────────────────────────── */

  async deleteEntry(id: string, userId: string, masterPassword: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { masterPasswordHash: true } });
    if (!user?.masterPasswordHash) throw new AppError('Master password not set. Please configure it in Security Settings.', 400, 'MASTER_PASSWORD_NOT_SET');
    const isValid = await comparePassword(masterPassword, user.masterPasswordHash);
    if (!isValid) throw new AppError('Incorrect master password', 401, 'INVALID_MASTER_PASSWORD');

    await this.getEntry(id, userId);
    await prisma.vaultEntry.delete({ where: { id } });
    await createActivityLog({ userId, action: 'VAULT_DELETE', resource: 'VaultEntry', resourceId: id, ipAddress });
  }

  /* ── TOGGLE FAVORITE ─────────────────────────────────────────────────── */

  async toggleFavorite(id: string, userId: string) {
    const entry = await this.getEntry(id, userId);
    return prisma.vaultEntry.update({
      where: { id },
      data: { isFavorite: !entry.isFavorite },
      select: { id: true, isFavorite: true },
    });
  }

  /* ── TOGGLE ARCHIVE ──────────────────────────────────────────────────── */

  async toggleArchive(id: string, userId: string, ipAddress?: string) {
    const entry = await this.getEntry(id, userId);
    const archivedAt = entry.archivedAt ? null : new Date();
    const updated = await prisma.vaultEntry.update({
      where: { id },
      data: { archivedAt },
      select: { id: true, archivedAt: true },
    });
    await createActivityLog({ userId, action: 'VAULT_ARCHIVE', resource: 'VaultEntry', resourceId: id, ipAddress });
    return updated;
  }

  /* ── LOG COPY ────────────────────────────────────────────────────────── */

  async logCopy(id: string, userId: string, ipAddress?: string) {
    await prisma.vaultEntry.update({ where: { id }, data: { lastAccessedAt: new Date() } });
    await createActivityLog({ userId, action: 'PASSWORD_COPY', resource: 'VaultEntry', resourceId: id, ipAddress });
  }

  /* ── SECURITY REPORT ─────────────────────────────────────────────────── */

  async getSecurityReport(userId: string) {
    const all = await prisma.vaultEntry.findMany({
      where: { userId, archivedAt: null },
      select: {
        id: true, title: true, platformName: true, provider: true, emailAddress: true,
        passwordStrength: true, twoFactorEnabled: true, isFavorite: true,
        lastPasswordChangedAt: true, nextPasswordReminderAt: true, importanceLevel: true,
        encryptedPassword: true, encryptionIv: true, encryptionTag: true,
        tags: { select: { name: true } },
      },
    });

    // Detect reused passwords by decrypting and hashing (SHA-256 of plaintext for comparison only)
    const pwHashes = new Map<string, string[]>();
    for (const e of all) {
      try {
        const plain = decrypt({ ciphertext: e.encryptedPassword, iv: e.encryptionIv, tag: e.encryptionTag });
        const h = crypto.createHash('sha256').update(plain).digest('hex');
        if (!pwHashes.has(h)) pwHashes.set(h, []);
        pwHashes.get(h)!.push(e.id);
      } catch {}
    }
    const reusedIds = new Set<string>();
    for (const ids of pwHashes.values()) {
      if (ids.length > 1) ids.forEach((id) => reusedIds.add(id));
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    const thirtyDays    = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const weak:     typeof all = [];
    const reused:   typeof all = [];
    const old:      typeof all = [];
    const expiring: typeof all = [];

    for (const e of all) {
      if ((e.passwordStrength ?? 100) < 40)                             weak.push(e);
      if (reusedIds.has(e.id))                                          reused.push(e);
      if (e.lastPasswordChangedAt && e.lastPasswordChangedAt < ninetyDaysAgo) old.push(e);
      if (e.nextPasswordReminderAt && e.nextPasswordReminderAt <= thirtyDays) expiring.push(e);
    }

    const no2fa    = all.filter((e) => !e.twoFactorEnabled);
    const critical = all.filter((e) => e.importanceLevel === 'CRITICAL');

    // Security score: start at 100, deduct for issues
    let score = 100;
    const total = all.length || 1;
    score -= Math.round((weak.length   / total) * 30);
    score -= Math.round((reused.length / total) * 25);
    score -= Math.round((old.length    / total) * 20);
    score -= Math.round((no2fa.length  / total) * 15);
    score  = Math.max(0, score);

    const stripSensitive = (e: typeof all[number]) => ({
      id: e.id,
      title: e.title,
      platformName: e.platformName,
      provider: e.provider,
      emailAddress: e.emailAddress,
      passwordStrength: e.passwordStrength,
      twoFactorEnabled: e.twoFactorEnabled,
      importanceLevel: e.importanceLevel,
      lastPasswordChangedAt: e.lastPasswordChangedAt,
      tags: e.tags,
    });

    return {
      score,
      total: all.length,
      issues: {
        weak:     weak.length,
        reused:   reused.length,
        old:      old.length,
        expiring: expiring.length,
        no2fa:    no2fa.length,
      },
      entries: {
        weak:     weak.map(stripSensitive),
        reused:   reused.map(stripSensitive),
        old:      old.map(stripSensitive),
        expiring: expiring.map(stripSensitive),
        no2fa:    no2fa.map(stripSensitive),
      },
      criticalWithoutTwoFA: critical.filter((e) => !e.twoFactorEnabled).map(stripSensitive),
    };
  }

  /* ── EXPORT (AES-256-GCM with user-provided export password) ─────────── */

  async exportVault(userId: string, masterPassword: string, exportPassword: string, ipAddress?: string) {
    // Verify master password
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { masterPasswordHash: true } });
    if (!user?.masterPasswordHash) throw new AppError('Master password not set', 400, 'MASTER_PASSWORD_NOT_SET');
    const valid = await comparePassword(masterPassword, user.masterPasswordHash);
    if (!valid) throw new AppError('Invalid master password', 401, 'INVALID_MASTER_PASSWORD');

    // Fetch all entries with encrypted fields
    const entries = await prisma.vaultEntry.findMany({
      where: { userId },
      include: { tags: { select: { name: true } } },
    });

    // Decrypt each entry's password for export
    const decryptedEntries = entries.map((e) => {
      const password = decrypt({ ciphertext: e.encryptedPassword, iv: e.encryptionIv, tag: e.encryptionTag });
      const notes    = e.encryptedNotes && e.notesIv && e.notesTag ? decrypt({ ciphertext: e.encryptedNotes, iv: e.notesIv, tag: e.notesTag }) : null;
      const backupCodes       = e.encryptedBackupCodes  && e.backupCodesIv  && e.backupCodesTag  ? decrypt({ ciphertext: e.encryptedBackupCodes,  iv: e.backupCodesIv,  tag: e.backupCodesTag  }) : null;
      const appPasswords      = e.encryptedAppPasswords && e.appPasswordsIv && e.appPasswordsTag ? decrypt({ ciphertext: e.encryptedAppPasswords, iv: e.appPasswordsIv, tag: e.appPasswordsTag }) : null;
      const securityQuestions = e.encryptedSecurityQuestions && e.securityQuestionsIv && e.securityQuestionsTag ? decrypt({ ciphertext: e.encryptedSecurityQuestions, iv: e.securityQuestionsIv, tag: e.securityQuestionsTag }) : null;

      return {
        title: e.title, platformName: e.platformName, provider: e.provider, platformUrl: e.platformUrl,
        emailAddress: e.emailAddress, username: e.username, password,
        notes, recoveryEmail: e.recoveryEmail, recoveryPhone: e.recoveryPhone,
        twoFactorEnabled: e.twoFactorEnabled, authenticatorApp: e.authenticatorApp,
        backupCodes, appPasswords, securityQuestions,
        category: e.category, importanceLevel: e.importanceLevel,
        isFavorite: e.isFavorite, archivedAt: e.archivedAt,
        lastPasswordChangedAt: e.lastPasswordChangedAt, nextPasswordReminderAt: e.nextPasswordReminderAt,
        createdAt: e.createdAt, updatedAt: e.updatedAt,
        tags: e.tags.map((t) => t.name),
      };
    });

    const bundle = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), entries: decryptedEntries });

    // Encrypt the bundle with the export password (PBKDF2 key derivation)
    const salt = crypto.randomBytes(32);
    const key  = crypto.pbkdf2Sync(exportPassword, salt, 200_000, 32, 'sha256');
    const iv   = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(bundle, 'utf8'), cipher.final()]);
    const tag  = cipher.getAuthTag();

    const payload = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');

    await createActivityLog({ userId, action: 'VAULT_EXPORT', resource: 'VaultEntry', ipAddress });
    return { payload, count: entries.length };
  }

  /* ── IMPORT ──────────────────────────────────────────────────────────── */

  async importVault(userId: string, masterPassword: string, exportPassword: string, payload: string, ipAddress?: string) {
    // Verify master password
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { masterPasswordHash: true } });
    if (!user?.masterPasswordHash) throw new AppError('Master password not set', 400, 'MASTER_PASSWORD_NOT_SET');
    const valid = await comparePassword(masterPassword, user.masterPasswordHash);
    if (!valid) throw new AppError('Invalid master password', 401, 'INVALID_MASTER_PASSWORD');

    // Decrypt the bundle
    let bundle: string;
    try {
      const buf  = Buffer.from(payload, 'base64');
      const salt = buf.subarray(0, 32);
      const iv   = buf.subarray(32, 48);
      const tag  = buf.subarray(48, 64);
      const data = buf.subarray(64);
      const key  = crypto.pbkdf2Sync(exportPassword, salt, 200_000, 32, 'sha256');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      bundle = decipher.update(data) + decipher.final('utf8');
    } catch {
      throw new AppError('Invalid export file or wrong export password', 400, 'IMPORT_DECRYPT_FAILED');
    }

    const { entries } = JSON.parse(bundle) as { entries: any[] };
    let imported = 0;

    for (const e of entries) {
      try {
        const pwdEnc = encrypt(e.password || '');
        await prisma.vaultEntry.create({
          data: {
            userId,
            title:        e.title       || e.platformName || 'Imported',
            platformName: e.platformName || 'Unknown',
            provider:     e.provider    || 'CUSTOM',
            platformUrl:  e.platformUrl || null,
            emailAddress: e.emailAddress,
            username:     e.username    || null,
            encryptedPassword: pwdEnc.ciphertext,
            encryptionIv:      pwdEnc.iv,
            encryptionTag:     pwdEnc.tag,
            ...(e.notes ? (() => { const r = encrypt(e.notes); return { encryptedNotes: r.ciphertext, notesIv: r.iv, notesTag: r.tag }; })() : {}),
            ...(e.backupCodes      ? (() => { const r = encrypt(e.backupCodes);      return { encryptedBackupCodes: r.ciphertext, backupCodesIv: r.iv, backupCodesTag: r.tag }; })() : {}),
            ...(e.appPasswords     ? (() => { const r = encrypt(e.appPasswords);     return { encryptedAppPasswords: r.ciphertext, appPasswordsIv: r.iv, appPasswordsTag: r.tag }; })() : {}),
            ...(e.securityQuestions? (() => { const r = encrypt(e.securityQuestions);return { encryptedSecurityQuestions: r.ciphertext, securityQuestionsIv: r.iv, securityQuestionsTag: r.tag }; })() : {}),
            recoveryEmail: e.recoveryEmail || null,
            recoveryPhone: e.recoveryPhone || null,
            twoFactorEnabled:  e.twoFactorEnabled || false,
            authenticatorApp:  e.authenticatorApp || null,
            category:          e.category          || null,
            importanceLevel:   e.importanceLevel   || 'MEDIUM',
            isFavorite:        e.isFavorite        || false,
            passwordStrength:  assessPasswordStrength(e.password || '').score,
            lastPasswordChangedAt:  e.lastPasswordChangedAt  ? new Date(e.lastPasswordChangedAt)  : null,
            nextPasswordReminderAt: e.nextPasswordReminderAt ? new Date(e.nextPasswordReminderAt) : null,
            tags: e.tags?.length ? { create: e.tags.map((t: string) => ({ name: t })) } : undefined,
          },
        });
        imported++;
      } catch { /* skip individual failures */ }
    }

    await createActivityLog({ userId, action: 'VAULT_IMPORT', resource: 'VaultEntry', metadata: { imported } as any, ipAddress });
    return { imported, total: entries.length };
  }

  /* ── ACTIVITY LOG ────────────────────────────────────────────────────── */

  async getActivity(userId: string, entryId?: string, limit = 50) {
    const where: Prisma.ActivityLogWhereInput = {
      userId,
      action: {
        in: ['VAULT_CREATE','VAULT_UPDATE','VAULT_DELETE','VAULT_ARCHIVE','PASSWORD_VIEW','PASSWORD_COPY',
             'BACKUP_CODES_VIEW','APP_PASSWORDS_VIEW','SECURITY_QUESTIONS_VIEW','VAULT_EXPORT','VAULT_IMPORT'] as any,
      },
    };
    if (entryId) where.resourceId = entryId;

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, action: true, resource: true, resourceId: true, success: true, ipAddress: true, createdAt: true, metadata: true },
    });
  }

  async getCategories(userId: string) {
    const results = await prisma.vaultEntry.findMany({
      where: { userId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return results.map((r) => r.category!).filter(Boolean);
  }
}

export const vaultService = new VaultService();
