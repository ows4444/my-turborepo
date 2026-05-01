ARG NODE_VERSION=24.13.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

FROM base AS prepare
RUN corepack enable && pnpm add -g turbo

COPY turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN turbo prune web --docker


FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN node -e "require('@repo/env').parseClientEnv()"

COPY --from=prepare /app/out/json/ .
COPY .npmrc ./

RUN corepack enable && pnpm fetch --prod
RUN pnpm install --offline --frozen-lockfile

COPY --from=prepare /app/out/full/ .

RUN pnpm turbo build --filter=web...

# prune dev deps
RUN pnpm prune --prod

# ---
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

CMD node apps/web/server.js
