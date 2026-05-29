-- ============================================================================
-- Export the FULL user audit log to CSV — including users who were DELETED.
--
-- Run (writes users_audit_export.csv into your current directory):
--   psql -U postgres -h localhost -d course_app -f scripts/03_export_audit_log.sql
--
-- For a timestamped file in backend/exports/, use the runner instead:
--   ./scripts/export_users.ps1   (Windows)
--   ./scripts/export_users.sh    (Linux/macOS)
--
-- Requires scripts/01_setup_user_archive.sql to have been run first.
-- "currently_exists" tells you if that user is still in the users table.
-- ============================================================================

\copy (SELECT a.audit_id, a.action, a.user_id, a.email, a.full_name, a.role, a.is_active, a.is_verified, a.avatar_color, a.user_created_at, a.changed_at, EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id) AS currently_exists FROM user_audit_log a ORDER BY a.changed_at) TO 'users_audit_export.csv' WITH (FORMAT csv, HEADER true)

\echo 'Exported full user audit log (including deleted users) to users_audit_export.csv'
