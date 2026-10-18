-- Add the children's category and keep the storefront order stable.
-- MySQL migration for the database configured in lib/db.ts.
INSERT INTO categories (parent_id, name, slug, description, image_url, sort_order)
VALUES (
  NULL,
  CONVERT(0x5472E1BABB20656D USING utf8mb4),
  'tre-em',
  CONVERT(0x5472616E67207068E1BBA5632074686FE1BAA369206DC3A1692064C3A06E682063686F2062C3A9 USING utf8mb4),
  '/images/cat-men.png',
  3
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  image_url = VALUES(image_url),
  sort_order = VALUES(sort_order);

UPDATE categories SET sort_order = 4 WHERE slug = 'phu-kien';
