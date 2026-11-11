-- Apply only after scripts/009_validate_integrity.sql reports zero for every rule.
-- Run once. Requires MySQL 8.0.16+ or MariaDB 10.3+ so CHECK constraints are enforced.

DROP PROCEDURE IF EXISTS assert_integrity_check_support;
DELIMITER //
CREATE PROCEDURE assert_integrity_check_support()
BEGIN
  DECLARE version_text VARCHAR(100);
  DECLARE major_version INT;
  DECLARE minor_version INT;
  DECLARE patch_version INT;

  SET version_text = VERSION();
  IF LOCATE('MariaDB', version_text) > 0 THEN
    SET version_text = SUBSTRING_INDEX(SUBSTRING_INDEX(version_text, '-MariaDB', 1), '-', -1);
    SET major_version = CAST(SUBSTRING_INDEX(version_text, '.', 1) AS UNSIGNED);
    SET minor_version = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version_text, '.', 2), '.', -1) AS UNSIGNED);
    IF major_version < 10 OR (major_version = 10 AND minor_version < 3) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity checks require MariaDB 10.3 or newer';
    END IF;
  ELSE
    SET version_text = SUBSTRING_INDEX(version_text, '-', 1);
    SET major_version = CAST(SUBSTRING_INDEX(version_text, '.', 1) AS UNSIGNED);
    SET minor_version = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version_text, '.', 2), '.', -1) AS UNSIGNED);
    SET patch_version = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version_text, '.', 3), '.', -1) AS UNSIGNED);
    IF major_version < 8 OR (major_version = 8 AND minor_version = 0 AND patch_version < 16) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity checks require MySQL 8.0.16 or newer';
    END IF;
  END IF;
END//
DELIMITER ;

CALL assert_integrity_check_support();
DROP PROCEDURE assert_integrity_check_support;

ALTER TABLE users
  ADD CONSTRAINT chk_users_role CHECK (
    BINARY role = BINARY LOWER(role) AND role IN ('customer', 'admin')
  ),
  ADD CONSTRAINT chk_users_email CHECK (
    BINARY email = BINARY LOWER(email)
    AND email REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  ADD CONSTRAINT chk_users_phone CHECK (
    phone IS NULL OR phone REGEXP '^0[0-9]{9}$'
  ),
  ADD CONSTRAINT chk_users_full_name CHECK (CHAR_LENGTH(TRIM(full_name)) > 0),
  ADD CONSTRAINT chk_users_password_hash CHECK (CHAR_LENGTH(TRIM(password_hash)) > 0);

ALTER TABLE addresses
  ADD COLUMN default_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin
    GENERATED ALWAYS AS (CASE WHEN is_default = 1 THEN user_id ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_addresses_single_default (default_user_id),
  ADD CONSTRAINT chk_addresses_default CHECK (is_default IN (0, 1)),
  ADD CONSTRAINT chk_addresses_fields CHECK (
    CHAR_LENGTH(TRIM(recipient_name)) > 0
    AND CHAR_LENGTH(TRIM(province)) > 0
    AND CHAR_LENGTH(TRIM(ward)) > 0
    AND CHAR_LENGTH(TRIM(street)) > 0
  ),
  ADD CONSTRAINT chk_addresses_phone CHECK (phone REGEXP '^0[0-9]{9}$');

ALTER TABLE categories
  ADD CONSTRAINT chk_categories_fields CHECK (
    CHAR_LENGTH(TRIM(name)) > 0 AND CHAR_LENGTH(TRIM(slug)) > 0
    AND BINARY slug = BINARY LOWER(slug)
  ),
  ADD CONSTRAINT chk_categories_sort_order CHECK (sort_order >= 0),
  ADD CONSTRAINT chk_categories_parent CHECK (parent_id IS NULL OR parent_id <> id);

ALTER TABLE colors
  ADD CONSTRAINT chk_colors_hex_code CHECK (hex_code REGEXP '^#[0-9A-Fa-f]{6}$');

ALTER TABLE sizes
  ADD CONSTRAINT chk_sizes_fields CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  ADD CONSTRAINT chk_sizes_sort_order CHECK (sort_order >= 0);

ALTER TABLE products
  ADD CONSTRAINT chk_products_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  ADD CONSTRAINT chk_products_description CHECK (
    description IS NULL OR CHAR_LENGTH(description) <= 5000
  ),
  ADD CONSTRAINT chk_products_type CHECK (
    BINARY product_type = BINARY LOWER(product_type)
    AND product_type IN ('shirt', 'pants', 'dress', 'jacket', 'skirt', 'hat', 'bag', 'wallet', 'belt', 'socks', 'sandals', 'shoes', 'gloves', 'other')
  ),
  ADD CONSTRAINT chk_products_gender CHECK (
    BINARY gender = BINARY LOWER(gender) AND gender IN ('women', 'men', 'unisex')
  ),
  ADD CONSTRAINT chk_products_status CHECK (
    BINARY status = BINARY LOWER(status) AND status IN ('draft', 'active', 'archived')
  ),
  ADD CONSTRAINT chk_products_price CHECK (
    base_price BETWEEN 1 AND 1000000000
    AND (sale_price IS NULL OR (sale_price > 0 AND sale_price < base_price))
  ),
  ADD CONSTRAINT chk_products_flags CHECK (is_featured IN (0, 1) AND is_new IN (0, 1));

ALTER TABLE product_images
  ADD CONSTRAINT chk_product_images_url CHECK (url REGEXP '^(https?://|/)'),
  ADD CONSTRAINT chk_product_images_sort_order CHECK (sort_order >= 0);

ALTER TABLE product_variants
  ADD CONSTRAINT chk_product_variants_sku CHECK (CHAR_LENGTH(TRIM(sku)) > 0),
  ADD CONSTRAINT chk_product_variants_price CHECK (
    price_override IS NULL OR price_override BETWEEN 1 AND 1000000000
  ),
  ADD CONSTRAINT chk_product_variants_stock CHECK (stock_quantity <= 1000000);

CREATE TABLE product_colors (
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  color_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, color_id),
  CONSTRAINT fk_product_colors_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_colors_color FOREIGN KEY (color_id) REFERENCES colors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO product_colors (product_id, color_id)
SELECT DISTINCT product_id, color_id FROM product_variants;

ALTER TABLE product_variants
  ADD CONSTRAINT fk_variants_product_color
    FOREIGN KEY (product_id, color_id) REFERENCES product_colors(product_id, color_id);

ALTER TABLE product_images
  ADD CONSTRAINT fk_images_product_color
    FOREIGN KEY (product_id, color_id) REFERENCES product_colors(product_id, color_id);

ALTER TABLE carts
  ADD CONSTRAINT chk_carts_single_owner CHECK (
    (user_id IS NULL AND session_token IS NOT NULL)
    OR (user_id IS NOT NULL AND session_token IS NULL)
  ),
  ADD CONSTRAINT chk_carts_session_token CHECK (
    session_token IS NULL OR CHAR_LENGTH(TRIM(session_token)) > 0
  );

ALTER TABLE cart_items
  ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity BETWEEN 1 AND 20);

ALTER TABLE coupons
  ADD CONSTRAINT chk_coupons_code CHECK (
    BINARY code = BINARY UPPER(code) AND BINARY code REGEXP '^[A-Z0-9_-]{3,30}$'
  ),
  ADD CONSTRAINT chk_coupons_type CHECK (
    BINARY discount_type = BINARY LOWER(discount_type)
    AND discount_type IN ('percent', 'fixed')
  ),
  ADD CONSTRAINT chk_coupons_value CHECK (
    value BETWEEN 1 AND 1000000000
    AND (discount_type <> 'percent' OR value <= 100)
  ),
  ADD CONSTRAINT chk_coupons_limits CHECK (
    min_order_amount <= 1000000000
    AND (max_discount IS NULL OR max_discount BETWEEN 1 AND 1000000000)
    AND (usage_limit IS NULL OR (usage_limit > 0 AND used_count <= usage_limit))
    AND is_active IN (0, 1)
  ),
  ADD CONSTRAINT chk_coupons_dates CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at
  );

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_code CHECK (CHAR_LENGTH(TRIM(code)) > 0),
  ADD CONSTRAINT chk_orders_status CHECK (
    BINARY status = BINARY LOWER(status)
    AND status IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')
  ),
  ADD CONSTRAINT chk_orders_payment_method CHECK (
    BINARY payment_method = BINARY LOWER(payment_method)
    AND payment_method IN ('cod', 'bank_transfer', 'ewallet', 'sepay')
  ),
  ADD CONSTRAINT chk_orders_payment_status CHECK (
    BINARY payment_status = BINARY LOWER(payment_status)
    AND payment_status IN ('unpaid', 'paid', 'refunded')
  ),
  ADD CONSTRAINT chk_orders_completed_not_unpaid CHECK (
    status <> 'completed' OR payment_status <> 'unpaid'
  ),
  ADD CONSTRAINT chk_orders_amounts CHECK (
    subtotal > 0
    AND discount_amount <= subtotal
    AND total + discount_amount = subtotal + shipping_fee
  ),
  ADD CONSTRAINT chk_orders_contact CHECK (
    CHAR_LENGTH(TRIM(recipient_name)) > 0
    AND phone REGEXP '^0[0-9]{9}$'
    AND BINARY email = BINARY LOWER(email)
    AND email REGEXP '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    AND CHAR_LENGTH(TRIM(shipping_address)) BETWEEN 1 AND 500
    AND (note IS NULL OR CHAR_LENGTH(note) <= 1000)
  );

ALTER TABLE order_items
  ADD UNIQUE KEY uq_order_items_variant (order_id, variant_id),
  ADD CONSTRAINT chk_order_items_snapshot CHECK (
    CHAR_LENGTH(TRIM(product_name)) > 0
    AND CHAR_LENGTH(TRIM(color_name)) > 0
    AND CHAR_LENGTH(TRIM(size_name)) > 0
  ),
  ADD CONSTRAINT chk_order_items_price CHECK (unit_price BETWEEN 1 AND 1000000000),
  ADD CONSTRAINT chk_order_items_quantity CHECK (quantity BETWEEN 1 AND 20);

ALTER TABLE reviews
  ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_reviews_comment CHECK (comment IS NULL OR CHAR_LENGTH(comment) <= 1000);

