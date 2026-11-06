# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci --no-audit --no-fund

COPY tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/frontend ./apps/frontend

# Vite inlines `import.meta.env.*` at build time, so the public backend URL is
# a build argument rather than a runtime environment variable.
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build --workspace @catalogue/frontend

# ---- Runtime stage ---------------------------------------------------------
FROM nginx:alpine AS runner

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
