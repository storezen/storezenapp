#!/usr/bin/env bash
set -euo pipefail

if [[ -f ".env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs)
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add it to .env or export it in your shell." >&2
  exit 1
fi

cmd="${1:-}"

case "$cmd" in
  generate)
    pnpm --filter @workspace/api-server run db:generate
    ;;
  migrate)
    pnpm --filter @workspace/api-server run db:migrate
    ;;
  reset)
    rm -rf apps/api/drizzle
    pnpm --filter @workspace/api-server run db:generate
    ;;
  *)
    echo "Usage: scripts/db.sh {generate|migrate|reset}" >&2
    exit 1
    ;;
esac

