FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN bun run build

FROM base AS production
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/dashboard/dist /app/apps/dashboard/dist
COPY packages/database/prisma /app/packages/database/prisma

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/dev.db"

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
