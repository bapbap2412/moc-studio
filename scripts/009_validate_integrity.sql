-- Run this first against the target database, after migrations 001-008.
-- Every invalid_rows value must be 0 before applying 010_enforce_integrity.sql.
SELECT 'users.role' AS rule, COUNT(*) AS invalid_rows
FROM users WHERE BINARY role NOT IN (BINARY 'customer', BINARY 'admin')
UNION ALL
SELECT 'users.email', COUNT(*)
FROM users WHERE BINARY email <> BINARY LOWER(email)
   OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   OR TRIM(full_name) = '' OR TRIM(password_hash) = ''
UNION ALL
SELECT 'users.phone', COUNT(*)
FROM users WHERE phone IS NOT NULL AND phone NOT REGEXP '^0[0-9]{9}$'
UNION ALL
SELECT 'addresses.fields', COUNT(*)
FROM addresses
WHERE TRIM(recipient_name) = '' OR TRIM(province) = '' OR TRIM(ward) = '' OR TRIM(street) = ''
UNION ALL
SELECT 'addresses.phone_or_default_flag', COUNT(*)
FROM addresses WHERE phone NOT REGEXP '^0[0-9]{9}$' OR is_default NOT IN (0, 1)
UNION ALL
SELECT 'addresses.multiple_defaults', COUNT(*)
FROM (
  SELECT user_id FROM addresses WHERE is_default = 1 GROUP BY user_id HAVING COUNT(*) > 1
) AS duplicate_defaults
UNION ALL
SELECT 'categories.fields_or_sort_order', COUNT(*)
FROM categories
WHERE TRIM(name) = '' OR TRIM(slug) = '' OR BINARY slug <> BINARY LOWER(slug)
   OR sort_order < 0 OR parent_id = id
UNION ALL
SELECT 'colors.hex_code', COUNT(*)
FROM colors WHERE hex_code NOT REGEXP '^#[0-9A-Fa-f]{6}$'
UNION ALL
SELECT 'sizes.name_or_sort_order', COUNT(*)
FROM sizes WHERE TRIM(name) = '' OR sort_order < 0
UNION ALL
SELECT 'products.fields_or_domain_values', COUNT(*)
FROM products
WHERE TRIM(name) = ''
   OR (description IS NOT NULL AND CHAR_LENGTH(description) > 5000)
   OR BINARY product_type NOT IN (BINARY 'shirt', BINARY 'pants', BINARY 'dress', BINARY 'jacket', BINARY 'skirt', BINARY 'hat', BINARY 'bag', BINARY 'wallet', BINARY 'belt', BINARY 'socks', BINARY 'sandals', BINARY 'shoes', BINARY 'gloves', BINARY 'other')
   OR BINARY gender NOT IN (BINARY 'women', BINARY 'men', BINARY 'unisex')
   OR BINARY status NOT IN (BINARY 'draft', BINARY 'active', BINARY 'archived')
   OR BINARY slug <> BINARY LOWER(slug)
   OR base_price NOT BETWEEN 1 AND 1000000000
   OR (sale_price IS NOT NULL AND (sale_price < 1 OR sale_price >= base_price))
   OR is_featured NOT IN (0, 1) OR is_new NOT IN (0, 1)
UNION ALL
SELECT 'product_images.url_or_sort_order', COUNT(*)
FROM product_images WHERE url NOT REGEXP '^(https?://|/)' OR sort_order < 0
UNION ALL
SELECT 'product_variants.fields_or_limits', COUNT(*)
FROM product_variants
WHERE TRIM(sku) = '' OR (price_override IS NOT NULL AND price_override NOT BETWEEN 1 AND 1000000000)
   OR stock_quantity > 1000000
UNION ALL
SELECT 'product_images.color_not_used_by_product', COUNT(*)
FROM product_images pi
WHERE pi.color_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.product_id = pi.product_id AND pv.color_id = pi.color_id
)
UNION ALL
SELECT 'carts.owner_shape', COUNT(*)
FROM carts WHERE (user_id IS NULL) = (session_token IS NULL)
   OR (session_token IS NOT NULL AND TRIM(session_token) = '')
UNION ALL
SELECT 'cart_items.quantity', COUNT(*)
FROM cart_items WHERE quantity NOT BETWEEN 1 AND 20
UNION ALL
SELECT 'coupons.fields_or_limits', COUNT(*)
FROM coupons
WHERE BINARY code NOT REGEXP '^[A-Z0-9_-]{3,30}$'
   OR BINARY discount_type NOT IN (BINARY 'percent', BINARY 'fixed') OR value < 1
   OR (discount_type = 'percent' AND value > 100)
   OR min_order_amount > 1000000000
   OR (max_discount IS NOT NULL AND max_discount NOT BETWEEN 1 AND 1000000000)
   OR (usage_limit IS NOT NULL AND (usage_limit < 1 OR used_count > usage_limit))
   OR is_active NOT IN (0, 1)
   OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at)
UNION ALL
SELECT 'orders.fields_or_domain_values', COUNT(*)
FROM orders
WHERE TRIM(code) = '' OR BINARY status NOT IN (BINARY 'pending', BINARY 'confirmed', BINARY 'shipping', BINARY 'completed', BINARY 'cancelled')
   OR BINARY payment_method NOT IN (BINARY 'cod', BINARY 'bank_transfer', BINARY 'ewallet', BINARY 'sepay')
   OR BINARY payment_status NOT IN (BINARY 'unpaid', BINARY 'paid', BINARY 'refunded')
   OR subtotal < 1 OR discount_amount > subtotal
   OR total + discount_amount <> subtotal + shipping_fee
   OR TRIM(recipient_name) = '' OR phone NOT REGEXP '^0[0-9]{9}$'
   OR BINARY email <> BINARY LOWER(email)
   OR email NOT REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   OR TRIM(shipping_address) = ''
   OR CHAR_LENGTH(shipping_address) > 500
   OR (note IS NOT NULL AND CHAR_LENGTH(note) > 1000)
UNION ALL
SELECT 'order_items.fields_or_limits', COUNT(*)
FROM order_items
WHERE TRIM(product_name) = '' OR TRIM(color_name) = '' OR TRIM(size_name) = ''
   OR unit_price NOT BETWEEN 1 AND 1000000000 OR quantity NOT BETWEEN 1 AND 20
UNION ALL
SELECT 'order_items.duplicate_order_variant', COUNT(*)
FROM (
  SELECT order_id, variant_id FROM order_items
  WHERE variant_id IS NOT NULL GROUP BY order_id, variant_id HAVING COUNT(*) > 1
) AS duplicate_lines
UNION ALL
SELECT 'reviews.rating_or_comment', COUNT(*)
FROM reviews WHERE rating NOT BETWEEN 1 AND 5 OR (comment IS NOT NULL AND CHAR_LENGTH(comment) > 1000);
