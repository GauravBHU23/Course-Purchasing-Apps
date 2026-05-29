-- ============================================================================
-- User archive + audit log
--
-- Purpose: keep a PERMANENT record of every registered user, even after the
-- user row is deleted from the "users" table.
--
-- Run once:
--   psql -U postgres -h localhost -d course_app -f scripts/01_setup_user_archive.sql
--
-- After this runs, every INSERT / UPDATE / DELETE on "users" is mirrored into
-- "user_audit_log". Deleting a user does NOT remove their audit history.
-- ============================================================================

-- 1) Permanent audit table. NOT linked by a foreign key, so it survives user
--    deletion. We never store the password hash here.
CREATE TABLE IF NOT EXISTS user_audit_log (
    audit_id      BIGSERIAL PRIMARY KEY,
    action        VARCHAR(10) NOT NULL,            -- INSERT | UPDATE | DELETE
    user_id       VARCHAR(36) NOT NULL,
    email         VARCHAR(255),
    full_name     VARCHAR(120),
    role          VARCHAR(30),
    is_active     BOOLEAN,
    is_verified   BOOLEAN,
    avatar_color  VARCHAR(20),
    avatar_url    VARCHAR(500),
    user_created_at TIMESTAMPTZ,                   -- created_at from the users row
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()  -- when this audit row was written
);

CREATE INDEX IF NOT EXISTS ix_user_audit_email   ON user_audit_log (email);
CREATE INDEX IF NOT EXISTS ix_user_audit_user_id ON user_audit_log (user_id);
CREATE INDEX IF NOT EXISTS ix_user_audit_action  ON user_audit_log (action);

-- 2) Trigger function: copy the affected row into the audit log.
CREATE OR REPLACE FUNCTION log_user_change() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO user_audit_log
            (action, user_id, email, full_name, role, is_active, is_verified,
             avatar_color, avatar_url, user_created_at)
        VALUES
            ('DELETE', OLD.id, OLD.email, OLD.full_name, OLD.role, OLD.is_active,
             OLD.is_verified, OLD.avatar_color, OLD.avatar_url, OLD.created_at);
        RETURN OLD;
    ELSE
        INSERT INTO user_audit_log
            (action, user_id, email, full_name, role, is_active, is_verified,
             avatar_color, avatar_url, user_created_at)
        VALUES
            (TG_OP, NEW.id, NEW.email, NEW.full_name, NEW.role, NEW.is_active,
             NEW.is_verified, NEW.avatar_color, NEW.avatar_url, NEW.created_at);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3) Attach the trigger to the users table.
DROP TRIGGER IF EXISTS trg_user_audit ON users;
CREATE TRIGGER trg_user_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_change();

-- 4) Backfill: record all users that already exist (so they aren't missed).
INSERT INTO user_audit_log
    (action, user_id, email, full_name, role, is_active, is_verified,
     avatar_color, avatar_url, user_created_at)
SELECT 'INSERT', id, email, full_name, role, is_active, is_verified,
       avatar_color, avatar_url, created_at
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_audit_log a WHERE a.user_id = users.id AND a.action = 'INSERT'
);

\echo 'User archive + audit trigger installed. All user changes are now logged permanently.'
