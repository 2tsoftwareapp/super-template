# One image per surface: docker build --target <api|worker|admin|web> .
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @lean/db --filter @lean/api --filter @lean/worker build \
  && pnpm --filter @lean/admin --filter @lean/web build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# API bundle plus the migrate/seed scripts and SQL files they apply.
FROM runtime AS api
ENV API_PORT=3001 MIGRATIONS_DIR=/app/migrations STORAGE_DIR=/app/storage
RUN mkdir -p /app/storage && chown node:node /app/storage
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/packages/db/dist ./db
COPY --from=build /repo/packages/db/migrations ./migrations
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${API_PORT}/api/v1/health || exit 1
CMD ["node", "--enable-source-maps", "dist/main.js"]

FROM runtime AS worker
COPY --from=build /repo/apps/worker/dist ./dist
USER node
CMD ["node", "--enable-source-maps", "dist/main.js"]

FROM runtime AS admin
ENV PORT=3002 HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
USER node
EXPOSE 3002
CMD ["node", "apps/admin/server.js"]

FROM runtime AS web
ENV PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
