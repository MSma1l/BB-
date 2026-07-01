# syntax=docker/dockerfile:1

# ---- Stage 1: build (install deps, generate Prisma client, compile TS -> dist) ----
FROM node:20-slim AS build
WORKDIR /app

# Prisma needs openssl available for engine detection at generate time.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install ALL deps (incl. dev: prisma CLI + typescript) using the lockfile.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build.
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build   # prisma generate + tsc -> dist (includes dist/seed.js, dist/server.js)

# Prune to production-only deps so the runtime node_modules is lean but keeps
# the generated @prisma/client engine.
RUN npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma query engine needs openssl at runtime too.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Production node_modules (with generated prisma client), compiled output, schema.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# Entrypoint: prisma db push -> seed -> start server.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
