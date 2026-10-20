-- One-time MySQL migration: divide all catalog prices by 10.
-- Existing order_items.unit_price values are intentionally left unchanged.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    VARCHAR(100) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

UPDATE products
SET base_price = GREATEST(1, ROUND(base_price / 10)),
    sale_price = CASE
      WHEN sale_price IS NULL THEN NULL
      ELSE GREATEST(1, ROUND(sale_price / 10))
    END
WHERE NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE version = '007_reduce_product_prices'
);

UPDATE product_variants
SET price_override = GREATEST(1, ROUND(price_override / 10))
WHERE price_override IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = '007_reduce_product_prices'
  );

INSERT IGNORE INTO schema_migrations (version)
VALUES ('007_reduce_product_prices');

COMMIT;
