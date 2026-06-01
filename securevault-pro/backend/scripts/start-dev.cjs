/**
 * Dev startup script — starts embedded PostgreSQL, runs migrations,
 * seeds the database, then launches the backend dev server.
 * No system PostgreSQL or Docker required.
 */
'use strict';

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '..');

/* ── 1. Patch DATABASE_URL in .env for embedded-postgres ─── */
const envPath = path.join(ROOT, '.env');
let envContent = fs.readFileSync(envPath, 'utf-8');

const EMBEDDED_DB_URL =
  'postgresql://postgres:password@localhost:5432/securevault_pro';

if (!envContent.includes(EMBEDDED_DB_URL)) {
  envContent = envContent.replace(
    /^DATABASE_URL=.*/m,
    `DATABASE_URL=${EMBEDDED_DB_URL}`,
  );
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Updated DATABASE_URL in .env for embedded-postgres');
}

/* ── 2. Start embedded PostgreSQL, then chain the rest ────── */
async function main() {
  const EmbeddedPostgres = require('embedded-postgres');
  const Pg = EmbeddedPostgres.default || EmbeddedPostgres;

  const pg = new Pg({
    databaseDir: path.join(ROOT, 'pgdata'),
    port: 5432,
    user: 'postgres',
    password: 'password',
    persistent: true,
    onLog: (msg) => {
      // Only show important messages
      if (msg.includes('ready') || msg.includes('error') || msg.includes('Error')) {
        process.stdout.write('[postgres] ' + msg + '\n');
      }
    },
  });

  const pgDataDir = path.join(ROOT, 'pgdata');
  const alreadyInit = fs.existsSync(path.join(pgDataDir, 'PG_VERSION'));

  if (!alreadyInit) {
    console.log('🐘 Initialising embedded PostgreSQL (first time)...');
    await pg.initialise();
  } else {
    console.log('🐘 PostgreSQL cluster already initialised, skipping init');
  }

  console.log('🐘 Starting embedded PostgreSQL on port 5432...');
  await pg.start();
  console.log('✓ PostgreSQL is running');

  /* Create database if it doesn't exist */
  const client = await pg.getPgClient();
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'securevault_pro'`
    );
    if (rows.length === 0) {
      await client.query('CREATE DATABASE securevault_pro');
      console.log('✓ Database securevault_pro created');
    } else {
      console.log('✓ Database securevault_pro already exists');
    }
  } finally {
    await client.end();
  }

  /* On Windows use .cmd wrappers; on Unix use the scripts directly */
  const isWin   = process.platform === 'win32';
  const prisma  = isWin ? 'node_modules\\.bin\\prisma.cmd'  : 'node_modules/.bin/prisma';
  const tsxBin  = isWin ? 'node_modules\\.bin\\tsx.cmd'     : 'node_modules/.bin/tsx';

  /* ── 3. Push schema to database (creates all tables) ──────── */
  console.log('\n📦 Pushing Prisma schema to database...');
  try {
    execSync(`"${prisma}" db push --skip-generate`, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, DATABASE_URL: EMBEDDED_DB_URL },
    });
    console.log('✓ Schema applied (all tables ready)');
  } catch (e) {
    console.error('Schema push failed — continuing anyway');
  }

  /* ── 4. Seed database ────────────────────────────────────── */
  console.log('\n🌱 Seeding database...');
  try {
    execSync(`"${tsxBin}" prisma/seed.ts`, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, DATABASE_URL: EMBEDDED_DB_URL },
    });
    console.log('✓ Database seeded');
  } catch (e) {
    console.log('ℹ  Seed skipped or already applied (continuing)');
  }

  /* ── 5. Start backend dev server ─────────────────────────── */
  console.log('\n🚀 Starting backend dev server on port 4000...\n');
  const server = spawn(
    tsxBin,
    ['watch', 'src/server.ts'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, DATABASE_URL: EMBEDDED_DB_URL, NODE_ENV: 'development' },
    },
  );

  server.on('exit', (code) => {
    console.log(`\nBackend exited with code ${code}`);
    pg.stop().then(() => process.exit(code ?? 0));
  });

  /* Graceful shutdown */
  const shutdown = async () => {
    console.log('\n\nShutting down...');
    server.kill('SIGTERM');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT',  shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP',  shutdown);
}

main().catch((err) => {
  console.error('\n❌ Startup failed:', err.message || err);
  process.exit(1);
});
