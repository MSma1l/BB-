#!/bin/sh
set -e

# Sync the Prisma schema to the database (no migrations file needed for this demo).
echo "[entrypoint] Pushing Prisma schema to the database..."
npx prisma db push --skip-generate --accept-data-loss

# Seed baseline data (admin user, default photo groups, etc.). Idempotent.
echo "[entrypoint] Seeding database..."
node dist/seed.js

# Start the API server.
echo "[entrypoint] Starting server..."
exec node dist/server.js
