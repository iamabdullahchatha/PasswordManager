import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ─── AES-256-GCM encrypt (mirrors src/config/encryption.ts) ──────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? 'ec517a7ba03d84a8841337fe44140ecbfe744479ab97fec02bf95e7805666852';
const IV_LENGTH      = 16;

function encryptPassword(plaintext: string) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: encrypted.toString('hex'),
    iv:  iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}

async function main() {
  console.log('\n🗑  Clearing all data...');

  // Delete in dependency order (children first)
  await prisma.vaultTag.deleteMany();
  await prisma.vaultEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ All data cleared.');

  // ─── Super Admin ─────────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash('SuperAdmin@123!', 12);
  const superAdmin = await prisma.user.create({
    data: {
      email:           'superadmin@securevault.pro',
      username:        'superadmin',
      firstName:       'Super',
      lastName:        'Admin',
      password:        superAdminHash,
      role:            Role.SUPER_ADMIN,
      isActive:        true,
      isEmailVerified: true,
    },
  });

  // ─── Demo vault entry (one Gmail account) ────────────────────────────────────
  const demoPassword   = 'Demo@12345!';
  const enc            = encryptPassword(demoPassword);

  await prisma.vaultEntry.create({
    data: {
      userId:            superAdmin.id,
      title:             'Gmail — Demo Account',
      platformName:      'Gmail',
      provider:          'GMAIL',
      platformUrl:       'https://mail.google.com',
      emailAddress:      'demo@gmail.com',
      username:          'demo',
      encryptedPassword: enc.ciphertext,
      encryptionIv:      enc.iv,
      encryptionTag:     enc.tag,
      importanceLevel:   'MEDIUM',
      isFavorite:        false,
      passwordStrength:  72,
    },
  });

  // ─── System Settings ─────────────────────────────────────────────────────────
  const settings = [
    { key: 'app_name',             value: 'SecureVault Pro',  description: 'Application name'                             },
    { key: 'session_timeout_ms',   value: '1800000',          description: 'Session timeout in milliseconds (30 min)'     },
    { key: 'max_vault_entries',    value: '500',              description: 'Maximum vault entries per user'                },
    { key: 'allow_registration',   value: 'false',            description: 'Allow public user registration'               },
    { key: 'password_expiry_days', value: '90',               description: 'Days before password expiry warning'          },
  ];

  await prisma.systemSetting.createMany({ data: settings });

  console.log('\n🌱 Seed complete!');
  console.log('');
  console.log('  Super Admin : superadmin@securevault.pro  /  SuperAdmin@123!');
  console.log('  Demo vault  : demo@gmail.com              /  Demo@12345!');
  console.log('');
  console.log('⚠️  Change the Super Admin password immediately after first login!');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
