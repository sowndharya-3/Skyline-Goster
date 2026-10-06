#!/usr/bin/env bash
# Build/update the GHOSTER app in place. Run from the project root on the VPS,
# after backend/.env and frontend/.env(.production) already have real values.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Frontend: install deps and build"
cd frontend
npm ci
npm run build
cd ..

echo "==> Backend: install deps"
cd backend
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

echo "==> Backend: run database migrations"
./.venv/bin/alembic upgrade head
cd ..

echo "==> Restart backend service"
sudo systemctl restart ghoster-backend

echo "==> Reload Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "Deploy complete."
