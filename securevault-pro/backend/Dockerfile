# ───────────────────────── Builder stage ─────────────────────────
FROM node:20-alpine AS builder

# Prisma requires OpenSSL + libc compatibility on Alpine,
# otherwise it cannot detect libssl and `prisma generate` fails.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ─────────────────────── Production stage ────────────────────────
FROM node:20-alpine AS production

# Same OpenSSL + libc compat is needed at runtime for the Prisma
# query engine and for `prisma db push` in start:prod.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# prisma CLI is in dependencies, so it is installed here for db push.
RUN npm ci --omit=dev

# Bring over the compiled app, generated Prisma client + engine, and schema.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads logs

EXPOSE 4000

# start:prod = prisma db push --skip-generate && node dist/server.js
CMD ["npm", "run", "start:prod"]
