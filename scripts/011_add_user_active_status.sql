-- Run once after scripts/010_enforce_integrity.sql.
-- Existing accounts remain active; an administrator can set is_active = 0 to revoke access.
ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD CONSTRAINT chk_users_active CHECK (is_active IN (0, 1));
