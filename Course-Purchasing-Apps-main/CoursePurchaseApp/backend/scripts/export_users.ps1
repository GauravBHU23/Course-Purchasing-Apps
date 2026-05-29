# ============================================================================
# export_users.ps1  (Windows / PowerShell)
#
# One command to:
#   1. Install the audit table + trigger (safe to run repeatedly)
#   2. Export current users        -> exports/users_<timestamp>.csv
#   3. Export full audit log       -> exports/users_audit_<timestamp>.csv
#
# Usage (from the backend folder):
#   ./scripts/export_users.ps1
#
# Optional env overrides:
#   $env:PGHOST, $env:PGPORT, $env:PGUSER, $env:PGDATABASE, $env:PGPASSWORD
# ============================================================================

# psql writes NOTICE lines to stderr; don't treat those as fatal.
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

# --- Connection settings (defaults match local dev) ---
if (-not $env:PGHOST)     { $env:PGHOST     = "localhost" }
if (-not $env:PGPORT)     { $env:PGPORT     = "5432" }
if (-not $env:PGUSER)     { $env:PGUSER     = "postgres" }
if (-not $env:PGDATABASE) { $env:PGDATABASE = "course_app" }
if (-not $env:PGPASSWORD) { $env:PGPASSWORD = "postgres" }

# Resolve paths relative to this script.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$exportDir = Join-Path $scriptDir "..\exports"
New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

$stamp     = Get-Date -Format "yyyy-MM-dd_HHmmss"
$usersCsv  = Join-Path $exportDir "users_$stamp.csv"
$auditCsv  = Join-Path $exportDir "users_audit_$stamp.csv"

Write-Host "Using database '$($env:PGDATABASE)' on $($env:PGHOST):$($env:PGPORT) as '$($env:PGUSER)'"

Write-Host "-> Installing/refreshing audit table + trigger..."
psql -f (Join-Path $scriptDir "01_setup_user_archive.sql")

Write-Host "-> Exporting current users..."
$usersQuery = "SELECT id, email, full_name, role, is_active, is_verified, avatar_color, avatar_url, created_at FROM users ORDER BY created_at"
psql -c "\copy ($usersQuery) TO '$usersCsv' WITH (FORMAT csv, HEADER true)"

Write-Host "-> Exporting full audit log (includes deleted users)..."
$auditQuery = "SELECT a.audit_id, a.action, a.user_id, a.email, a.full_name, a.role, a.is_active, a.is_verified, a.avatar_color, a.user_created_at, a.changed_at, EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id) AS currently_exists FROM user_audit_log a ORDER BY a.changed_at"
psql -c "\copy ($auditQuery) TO '$auditCsv' WITH (FORMAT csv, HEADER true)"

Write-Host ""
Write-Host "Done. Files written:" -ForegroundColor Green
Write-Host "  $usersCsv"
Write-Host "  $auditCsv"
