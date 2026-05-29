#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$FRONTEND_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js 22+ first."
  exit 1
fi

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "Created frontend/.env.local from .env.example"
fi

if [ ! -d "node_modules" ]; then
  npm install
fi

echo "Frontend running at http://localhost:3000"
npm run dev

