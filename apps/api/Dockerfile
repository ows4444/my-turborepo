# =========================
# Base
# =========================
ARG NODE_VERSION=24.13.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Improve pnpm caching
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# =========================
# Prune (Turbo)
# =========================
FROM base AS prune

RUN pnpm add -g turbo

COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages

# Create pruned monorepo for API only
RUN turbo prune api --docker


# =========================
# Install Dependencies
# =========================
FROM base AS installer

WORKDIR /app

# Only package.json + lockfile (better caching)
COPY --from=prune /app/out/json/ .
COPY .npmrc ./

RUN pnpm fetch --prod
RUN pnpm install --offline --frozen-lockfile


# =========================
# Build
# =========================
FROM installer AS builder

# Copy full source
COPY --from=prune /app/out/full/ .

# Build only required packages
RUN pnpm turbo build --filter=api...

# prune devDependencies AFTER build
RUN pnpm prune --prod


# =========================
# Runtime (small + secure)
# =========================
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

USER nodejs

# Copy only what is needed (NOT full repo)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Start app
CMD ["node", "apps/api/dist/main.js"]