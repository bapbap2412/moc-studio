-- Add the new-arrival flag required by the admin and storefront queries.
-- Apply once to databases that have already run migrations 001-005.
ALTER TABLE products
  ADD COLUMN is_new TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured;
