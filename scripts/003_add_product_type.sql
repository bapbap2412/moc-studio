-- MySQL migration: classify products by garment type.
ALTER TABLE products
  ADD COLUMN product_type VARCHAR(30) NOT NULL DEFAULT 'other' AFTER category_id;

UPDATE products
SET product_type = CASE
  WHEN slug LIKE 'ao-khoac%' OR slug LIKE 'blazer-%' OR slug LIKE 'cardigan-%' THEN 'jacket'
  WHEN slug LIKE 'quan-%' THEN 'pants'
  WHEN slug LIKE 'dam-%' THEN 'dress'
  WHEN slug LIKE 'ao-%' THEN 'shirt'
  WHEN slug LIKE 'tui-%' OR slug LIKE 'mu-%' OR slug LIKE 'that-lung%' THEN 'accessories'
  ELSE 'other'
END;
