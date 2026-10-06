#!/usr/bin/env bash
# Run database migrations only. Usage: ./migrate.sh [upgrade|downgrade] [target]
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT/backend"

ACTION="${1:-upgrade}"
TARGET="${2:-head}"

./.venv/bin/alembic "$ACTION" "$TARGET"
