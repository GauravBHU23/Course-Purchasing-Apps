#!/usr/bin/env bash
# ============================================================================
# export_users.sh  (Linux / macOS / Git-Bash)
#
# One command to:
#   1. Install the audit table + trigger (safe to run repeatedly)
#   2. Export current users  -> exports/users_<timestamp>.csv
#   3. Export full audit log -> exports/users_audit_<timestamp>.csv
#
# Usage (from the backend folder):
#   ./scripts/export_users.sh
#
# Optional env overrides:
#   PGHOST, PGPORT, PGUSER, PGDATABASE, PGPASSWORD
# ============================================================================
set -euo pipefail

export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGDATABASE="${PGDATABASE:-course_app}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="$SCRIPT_DIR/../exports"
mkdir -p "$EXPORT_DIR"

STAMP="$(date +%Y-%m-%d_%H%M%S)"
USERS_CSV="$EXPORT_DIR/users_$STAMP.csv"
AUDIT_CSV="$EXPORT_DIR/users_audit_$STAMP.csv"

echo "Using database '$PGDATABASE' on $PGHOST:$PGPORT as '$PGUSER'"

echo "-> Installing/refreshing audit table + trigger..."
psql -f "$SCRIPT_DIR/01_setup_user_archive.sql"

echo "-> Exporting current users..."
USERS_QUERY="SELECT id, email, full_name, role, is_active, is_verified, avatar_color, avatar_url, created_at FROM users ORDER BY created_at"
psql -c "\copy ($USERS_QUERY) TO '$USERS_CSV' WITH (FORMAT csv, HEADER true)"

echo "-> Exporting full audit log (includes deleted users)..."
AUDIT_QUERY="SELECT a.audit_id, a.action, a.user_id, a.email, a.full_name, a.role, a.is_active, a.is_verified, a.avatar_color, a.user_created_at, a.changed_at, EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id) AS currently_exists FROM user_audit_log a ORDER BY a.changed_at"
psql -c "\copy ($AUDIT_QUERY) TO '$AUDIT_CSV' WITH (FORMAT csv, HEADER true)"

echo ""
echo "Done. Files written:"
echo "  $USERS_CSV"
echo "  $AUDIT_CSV"
