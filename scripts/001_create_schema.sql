-- MOC Studio base schema for MySQL 5.7+ / MariaDB 10.3+.
-- Select the target database before running this file.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  phone         VARCHAR(20) NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'customer',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
  id             CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id        CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  province       VARCHAR(100) NOT NULL,
  district       VARCHAR(100) NOT NULL,
  ward           VARCHAR(100) NOT NULL,
  street         VARCHAR(255) NOT NULL,
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_addresses_user_default (user_id, is_default),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id   INT UNSIGNED NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  description TEXT NULL,
  image_url   VARCHAR(1000) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent_order (parent_id, sort_order),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS colors (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(50) NOT NULL,
  hex_code CHAR(7) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_colors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sizes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(20) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sizes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- product_type and is_new are added by migrations 003 and 006.
CREATE TABLE IF NOT EXISTS products (
  id                CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  category_id       INT UNSIGNED NOT NULL,
  name              VARCHAR(200) NOT NULL,
  slug              VARCHAR(220) NOT NULL,
  description       TEXT NULL,
  material          TEXT NULL,
  care_instructions TEXT NULL,
  base_price        INT UNSIGNED NOT NULL,
  sale_price        INT UNSIGNED NULL,
  gender            VARCHAR(10) NOT NULL DEFAULT 'unisex',
  status            VARCHAR(10) NOT NULL DEFAULT 'draft',
  is_featured       TINYINT(1) NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_status_created (status, created_at),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  color_id   INT UNSIGNED NULL,
  url        VARCHAR(1000) NOT NULL,
  alt_text   VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_images_product_order (product_id, sort_order),
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_images_color FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id             CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id     CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  color_id       INT UNSIGNED NOT NULL,
  size_id        INT UNSIGNED NOT NULL,
  sku            VARCHAR(60) NOT NULL,
  price_override INT UNSIGNED NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variants_sku (sku),
  UNIQUE KEY uq_variants_product_color_size (product_id, color_id, size_id),
  KEY idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_variants_color FOREIGN KEY (color_id) REFERENCES colors(id),
  CONSTRAINT fk_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
  id            CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id       CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  session_token VARCHAR(100) NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_user (user_id),
  UNIQUE KEY uq_carts_session (session_token),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  variant_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_variant (cart_id, variant_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code             VARCHAR(30) NOT NULL,
  discount_type    VARCHAR(10) NOT NULL,
  value            INT UNSIGNED NOT NULL,
  min_order_amount INT UNSIGNED NOT NULL DEFAULT 0,
  max_discount     INT UNSIGNED NULL,
  usage_limit      INT UNSIGNED NULL,
  used_count       INT UNSIGNED NOT NULL DEFAULT 0,
  starts_at        DATETIME NULL,
  ends_at          DATETIME NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id               CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  code             VARCHAR(30) NOT NULL,
  user_id          CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  status           VARCHAR(12) NOT NULL DEFAULT 'pending',
  payment_method   VARCHAR(15) NOT NULL,
  payment_status   VARCHAR(10) NOT NULL DEFAULT 'unpaid',
  subtotal         INT UNSIGNED NOT NULL,
  shipping_fee     INT UNSIGNED NOT NULL DEFAULT 0,
  discount_amount  INT UNSIGNED NOT NULL DEFAULT 0,
  total            INT UNSIGNED NOT NULL,
  coupon_id        INT UNSIGNED NULL,
  recipient_name   VARCHAR(120) NOT NULL,
  phone            VARCHAR(20) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  note             TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (code),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  variant_id   CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  product_name VARCHAR(200) NOT NULL,
  color_name   VARCHAR(50) NOT NULL,
  size_name    VARCHAR(20) NOT NULL,
  unit_price   INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_product_user (product_id, user_id),
  KEY idx_reviews_product (product_id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  user_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed lookup data used by the admin product form. IDs match lib/data.ts.
INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
  (1, CONVERT(0xC490E1BB93204EE1BBAF USING utf8mb4), 'nu', NULL, '/images/cat-women.png', 1),
  (2, CONVERT(0xC490E1BB93204E616D USING utf8mb4), 'nam', NULL, '/images/cat-men.png', 2),
  (3, CONVERT(0x5068E1BBA5206B69E1BB876E USING utf8mb4), 'phu-kien', NULL, '/images/cat-accessories.png', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), image_url = VALUES(image_url), sort_order = VALUES(sort_order);

INSERT INTO colors (id, name, hex_code) VALUES
  (1, 'Kem', '#EDE4D3'),
  (2, CONVERT(0xC490656E USING utf8mb4), '#2A2826'),
  (3, 'Be', '#D4C2A3'),
  (4, CONVERT(0x58616E682072C3AA75 USING utf8mb4), '#7C8565'),
  (5, CONVERT(0x4EC3A275 USING utf8mb4), '#6B4A35'),
  (6, CONVERT(0xC490E1BAA574206E756E67 USING utf8mb4), '#B5532F'),
  (7, CONVERT(0x54E1BBB1206E6869C3AA6E USING utf8mb4), '#C9A979')
ON DUPLICATE KEY UPDATE hex_code = VALUES(hex_code);

INSERT INTO sizes (id, name, sort_order) VALUES
  (1, 'XS', 1), (2, 'S', 2), (3, 'M', 3), (4, 'L', 4), (5, 'XL', 5), (6, 'Free size', 6)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);
