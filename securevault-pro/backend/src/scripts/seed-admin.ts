/**
 * Production-safe Super Admin seeder.
 *
 * Designed to run BOTH manually and automatically as part of start:prod.
 * It never crashes the boot sequence — on any skip/error it exits 0 so the
 * API server still starts.
 *
 * Behaviour:
 *   - SUPER_ADMIN_PASSWORD not set        → skip (nothing to do).
 *   - admin email does not exist          → CREATE the Super Admin.
 *   - admin email already exists          → leave it untouched (so a password
 *                                           the user later changed is preserved),
 *                                           UNLESS ADMIN_SEED_FORCE=true, which
 *                                           promotes + resets that account.
 *
 * Secrets are NEVER hardcoded — the password always comes from the
 * SUPER_ADMIN_PASSWORD environment variable.
 *
 * Local (dev):   npm run seed:admin:dev
 * Production:    npm run seed:admin       (compiled dist/ version)
 * Automatic:     runs inside start:prod on every Railway deploy.
 *
 * Env:
 *   SUPER_ADMIN_PASSWORD   (required to do anything) admin password, min 8 chars
 *   ADMIN_SEED_FORCE       (optional) "true" → reset/promote an existing account
 *   SUPER_ADMIN_EMAIL      default: abdullahchattha988@gmail.com
 *   SUPER_ADMIN_USERNAME   default: Super_admin
 *   SUPER_ADMIN_FIRSTNAME  default: Abdullah
 *   SUPER_ADMIN_LASTNAME   default: Chatha
 *   DATABASE_URL           provided automatically by Railway
 */
import 'dotenv/config';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

async function run(): Promise<void> {
  const email     = (process.env.SUPER_ADMIN_EMAIL     ?? 'abdullahchattha988@gmail.com').toLowerCase().trim();
  const username  =  process.env.SUPER_ADMIN_USERNAME  ?? 'Super_admin';
  const firstName =  process.env.SUPER_ADMIN_FIRSTNAME ?? 'Abdullah';
  const lastName  =  process.env.SUPER_ADMIN_LASTNAME  ?? 'Chatha';
  const password  =  process.env.SUPER_ADMIN_PASSWORD;
  const force     =  process.env.ADMIN_SEED_FORCE === 'true';

  if (!password) {
    console.log('ℹ️  [admin-seed] SUPER_ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }
  if (password.length < 8) {
    console.log('⚠️  [admin-seed] SUPER_ADMIN_PASSWORD is shorter than 8 chars — skipping.');
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, role: true },
  });

  // ── Already exists ──────────────────────────────────────────────────────────
  if (existing && !force) {
    console.log(`✅ [admin-seed] Super Admin already exists (${email}, role ${existing.role}). Leaving untouched.`);
    console.log('   Set ADMIN_SEED_FORCE=true to reset its password / promote it.');
    return;
  }

  const hashed = await hashPassword(password);

  if (existing && force) {
    const user = await prisma.user.update({
      where: { email },
      data: {
        firstName,
        lastName,
        password: hashed,
        role: Role.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordChangedAt: new Date(),
      },
      select: { id: true, email: true, username: true, role: true },
    });
    console.log(`♻️  [admin-seed] Force-updated existing account → Super Admin: ${user.email} (${user.role})`);
    return;
  }

  // ── Create new ──────────────────────────────────────────────────────────────
  const usernameTaken = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  const finalUsername = usernameTaken ? `${username}_${Date.now().toString().slice(-4)}` : username;

  const user = await prisma.user.create({
    data: {
      email,
      username: finalUsername,
      firstName,
      lastName,
      password: hashed,
      role: Role.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
    select: { id: true, email: true, username: true, role: true },
  });

  console.log(`✅ [admin-seed] Created Super Admin: ${user.email}`);
  if (finalUsername !== username) {
    console.log(`   ⚠️  Username "${username}" was taken; used "${finalUsername}".`);
  }
  console.log(`   username: ${user.username} · role: ${user.role}`);
  console.log('🔐 You can now sign in with this email and the SUPER_ADMIN_PASSWORD you set.');
}

run()
  .catch((err) => {
    // Never block server startup — log loudly but exit 0.
    console.error('⚠️  [admin-seed] Skipped due to error:', err instanceof Error ? err.message : err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
