#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

cd "$BACKEND_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required. Install Python 3.12+ first."
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
  echo "Update DATABASE_URL and JWT_SECRET before production."
fi

if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi

PYTHON_BIN=".venv/bin/python"

if [ ! -f ".venv/.deps-installed" ]; then
  if ! "$PYTHON_BIN" -m ensurepip --version >/dev/null 2>&1; then
    echo "Python pip/venv support is missing."
    echo "Install it first: sudo apt install -y python3-pip python3-venv"
    exit 1
  fi
  "$PYTHON_BIN" -m ensurepip --upgrade
  "$PYTHON_BIN" -m pip install --upgrade pip
  "$PYTHON_BIN" -m pip install -r requirements.txt
  touch .venv/.deps-installed
fi

echo "Running database migrations..."
"$PYTHON_BIN" -m alembic upgrade head

echo "Seeding courses..."
"$PYTHON_BIN" -m app.db.seed

echo "Backend running at http://localhost:8000"
"$PYTHON_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
