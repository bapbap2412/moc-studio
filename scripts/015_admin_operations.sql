-- Run once after migrations 013 and 014.
-- Log identifiers are snapshots without foreign keys so this migration also works
-- with legacy databases whose UUID columns use a different character set/collation.
ALTER TABLE reviews
  ADD COLUMN admin_reply TEXT NULL AFTER is_visible,
  ADD COLUMN admin_replied_at DATETIME NULL AFTER admin_reply;

CREATE TABLE inventory_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  variant_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  sku_snapshot VARCHAR(60) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  size_name VARCHAR(20) NOT NULL,
  stock_before INT UNSIGNED NOT NULL,
  stock_after INT UNSIGNED NOT NULL,
  reason VARCHAR(255) NOT NULL,
  admin_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_movements_created (created_at),
  KEY idx_inventory_movements_variant_created (variant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100) NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_audit_created (created_at),
  KEY idx_admin_audit_actor_created (admin_user_id, created_at),
  KEY idx_admin_audit_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
