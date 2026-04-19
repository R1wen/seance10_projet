#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Seeding database..."
node dist/database/seed.js

echo "Starting server..."
exec node dist/server.js
