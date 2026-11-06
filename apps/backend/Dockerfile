# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only manifests first so dependency installation is cached independently
# of source changes (the lockfile covers every workspace).
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci --no-audit --no-fund

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/backend ./apps/backend

RUN npm run build --workspace @catalogue/contracts \
  && npm run build --workspace @catalogue/backend

# ---- Runtime stage ---------------------------------------------------------
FROM node:20-alpine AS runner

ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

# `npm ci` is used (not a copied node_modules) so the runtime image contains
# exactly the production dependency tree recorded in the lockfile and creates
# the workspace symlink for @catalogue/contracts.
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci --omit=dev --no-audit --no-fund \
  && npm cache clean --force

COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Running from the workspace directory keeps the start command conventional;
# Node still resolves @catalogue/contracts from /app/node_modules.
WORKDIR /app/apps/backend

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then((r) => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "dist/server.js"]
