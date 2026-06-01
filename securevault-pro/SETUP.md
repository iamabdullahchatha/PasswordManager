# SecureVault Pro — Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm or pnpm

---

## Quick Start (Docker)

```bash
# 1. Clone and navigate
cd securevault-pro

# 2. Copy env file
cp backend/.env.example backend/.env
# Edit backend/.env with your settings (especially ENCRYPTION_KEY and JWT secrets)

# 3. Start all services
docker-compose up -d

# 4. Run migrations and seed
docker exec securevault_backend npx prisma migrate deploy
docker exec securevault_backend npx tsx prisma/seed.ts
```

---

## Manual Development Setup

### Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# IMPORTANT: Change these values in .env:
#   - DATABASE_URL
#   - JWT_ACCESS_SECRET (min 64 chars)
#   - JWT_REFRESH_SECRET (min 64 chars)
#   - ENCRYPTION_KEY (exactly 64 hex chars = 32 bytes)
#   - BCRYPT_ROUNDS (12 recommended)

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with default users
npm run prisma:seed

# Start development server
npm run dev
```

Backend runs at: http://localhost:4000

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Default Credentials

| Role        | Email                          | Password          |
|-------------|--------------------------------|-------------------|
| Super Admin | superadmin@securevault.pro     | SuperAdmin@123!   |
| Admin       | admin@securevault.pro          | Admin@12345!      |
| User        | user@securevault.pro           | User@12345!       |

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

---

## Generating a Secure ENCRYPTION_KEY

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

## Generating JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## API Endpoints Summary

| Module     | Base Path              |
|------------|------------------------|
| Auth       | /api/v1/auth           |
| Users      | /api/v1/users          |
| Vault      | /api/v1/vault          |
| Expenses   | /api/v1/expenses       |
| Reports    | /api/v1/reports        |
| Logs       | /api/v1/logs           |
| Dashboard  | /api/v1/dashboard      |
| Settings   | /api/v1/settings       |

Full API: GET /health — health check

---

## Security Architecture

- **Passwords**: bcrypt (12 rounds)
- **Vault encryption**: AES-256-GCM with random IV per entry
- **Auth**: JWT access tokens (15min) + refresh tokens (7d, stored in DB)
- **Master password**: Additional bcrypt-hashed layer for vault access
- **Rate limiting**: Global + stricter auth/sensitive routes
- **Account lockout**: 5 failed attempts → 30-minute lock
- **Auto-logout**: 30 minutes of inactivity
- **Audit trail**: Every action logged with IP, user agent, and timestamp
- **Token rotation**: New refresh token issued on every refresh
