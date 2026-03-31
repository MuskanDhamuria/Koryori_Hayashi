#!/usr/bin/env sh
set -eu

SYNC_STATE_PATH="${SYNC_STATE_PATH:-.data/spreadsheet-sync.json}"
mkdir -p "$(dirname "$SYNC_STATE_PATH")"

PRISMA_DB_PUSH_ON_START="${PRISMA_DB_PUSH_ON_START:-1}"
if [ "$PRISMA_DB_PUSH_ON_START" = "1" ]; then
  echo "Running Prisma schema sync (prisma db push)..."
  npx prisma db push
fi

exec "$@"

