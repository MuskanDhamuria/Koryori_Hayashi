#!/usr/bin/env sh
set -eu

SYNC_STATE_PATH="${SYNC_STATE_PATH:-.data/spreadsheet-sync.json}"
mkdir -p "$(dirname "$SYNC_STATE_PATH")"

PRISMA_DB_PUSH_ON_START="${PRISMA_DB_PUSH_ON_START:-1}"
if [ "$PRISMA_DB_PUSH_ON_START" = "1" ]; then
  if [ -z "${DATABASE_URL:-}" ] || [ -z "${DIRECT_URL:-}" ]; then
    echo "Missing DATABASE_URL and/or DIRECT_URL. Set them in your environment (Render service env vars)."
    exit 1
  fi
  echo "Running Prisma schema sync (prisma db push)..."
  # Use DIRECT_URL for schema operations; pooled connections (PgBouncer) often block them.
  DATABASE_URL="$DIRECT_URL" npx prisma db push
fi

exec "$@"
