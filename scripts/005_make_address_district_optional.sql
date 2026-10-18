-- MySQL migration: district is no longer a required address level.
-- Existing district values are preserved for previously saved addresses.
ALTER TABLE addresses
  MODIFY COLUMN district VARCHAR(100) NULL DEFAULT NULL;
