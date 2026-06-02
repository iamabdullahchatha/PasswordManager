/**
 * Production-safe Super Admin seeder.
 *
 * Idempotent: creates the Super Admin if it does not exist, or promotes /
 * resets the existing account (by email) to Super Admin. Safe to run many times.
 *
 * Secrets are NEVER hardcoded — the password comes from the SUPER_ADMIN_PASSWORD
 * environment variable. The rest have sensible defaults but can be overridden.
 *
 * Local (dev):   npm run seed:admin:dev
 * Production:    npm run seed:admin      (runs the compiled dist/ version)
 *
 * Required env:
 *   SUPER_ADMIN_PASSWORD   the admin password (min 8 chars)
 *   DATABASE_URL           provided automatically by Railway
 *
 * Optional env (override defaults):
 *   SUPER_ADMIN_EMAIL      default: abdullahchattha988@gmail.com
 *   SUPER_ADMIN_USERNAME   default: Super_admin
 *   SUPER_ADMIN_FIRSTNAME  default: Abdullah
 *   SUPER_ADMIN_LASTNAME   default: Chatha
 */
import 'dotenv/config';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';

async function main(): Promise<void> {
  const email     = (process.env.SUPER_ADMIN_EMAIL     ?? 'abdullahchattha988@gmail.com').toLowerCase().trim();
  const username  =  process.env.SUPER_ADMIN_USERNAME  ?? 'Super_admin';
  const firstName =  process.env.SUPER_ADMIN_FIRSTNAME ?? 'Abdullah';
  const lastName  =  process.env.SUPER_ADMIN_LASTNAME  ?? 'Chatha';
  const password  =  process.env.SUPER_ADMIN_PASSWORD;

  // ── Safety checks ──────────────────────────────────────────────────────────
  if (!password) {
    console.error('❌ SUPER_ADMIN_PASSWORD is not set.');
    console.error('   Set it before running, e.g. on Railway add a variable');
    console.error('   SUPER_ADMIN_PASSWORD=your-strong-password, then run the seed.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ SUPER_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const hashed = await hashPassword(password);

  // ── Does this email already exist? ─────────────────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, role: true },
  });

  let user;

  if (existing) {
    // Promote / reset the existing account. We do NOT change the username here
    // to avoid colliding with the unique constraint.
    user = await prisma.user.update({
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
    console.log(`♻️  Updated existing account → Super Admin: ${user.email}`);
  } else {
    // Guard against a username collision with a different account.
    const usernameTaken = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    const finalUsername = usernameTaken ? `${username}_${Date.now().toString().slice(-4)}` : username;

    user = await prisma.user.create({
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
    console.log(`✅ Created new Super Admin: ${user.email}`);
    if (finalUsername !== username) {
      console.log(`   ⚠️  Username "${username}" was taken; used "${finalUsername}" instead.`);
    }
  }

  console.log('');
  console.log('   id:       ' + user.id);
  console.log('   email:    ' + user.email);
  console.log('   username: ' + user.username);
  console.log('   role:     ' + user.role);
  console.log('');
  console.log('🔐 You can now sign in with this email and the password you set.');
}

main()
  .catch((err) => {
    console.error('❌ Admin seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
