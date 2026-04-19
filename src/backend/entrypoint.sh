#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Starting server..."
exec node dist/server.js
