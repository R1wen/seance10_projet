#!/bin/sh

echo "Running Prisma migrations..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy || echo "Migration failed, continuing..."

echo "Seeding database..."
node dist/database/seed.js || echo "Seed failed, continuing anyway..."

echo "Starting server..."
exec node dist/server.js