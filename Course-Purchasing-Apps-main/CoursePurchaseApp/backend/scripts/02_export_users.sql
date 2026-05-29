-- ============================================================================
-- Export all CURRENT registered users to a CSV file.
--
-- Run (writes users_export.csv into your current directory):
--   psql -U postgres -h localhost -d course_app -f scripts/02_export_users.sql
--
-- For a timestamped file in backend/exports/, use the runner instead:
--   ./scripts/export_users.ps1   (Windows)
--   ./scripts/export_users.sh    (Linux/macOS)
--
-- The password hash is intentionally NOT exported.
-- ============================================================================

\copy (SELECT id, email, full_name, role, is_active, is_verified, avatar_color, avatar_url, created_at FROM users ORDER BY created_at) TO 'users_export.csv' WITH (FORMAT csv, HEADER true)

\echo 'Exported current users to users_export.csv (in current directory)'
