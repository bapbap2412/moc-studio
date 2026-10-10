-- MỘC Studio — Schema PostgreSQL
-- Giá tiền lưu dạng INTEGER (đơn vị: VND)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(10) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(120) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  province       VARCHAR(100) NOT NULL,
  district       VARCHAR(100) NOT NULL,
  ward           VARCHAR(100) NOT NULL,
  street         VARCHAR(255) NOT NULL,
  is_default     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  parent_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  image_url  TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS colors (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(50) NOT NULL UNIQUE,
  hex_code CHAR(7) NOT NULL
);

CREATE TABLE IF NOT EXISTS sizes (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(20) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       INTEGER NOT NULL REFERENCES categories(id),
  name              VARCHAR(200) NOT NULL,
  slug              VARCHAR(220) NOT NULL UNIQUE,
  description       TEXT,
  material          TEXT,
  care_instructions TEXT,
  base_price        INTEGER NOT NULL CHECK (base_price > 0),
  sale_price        INTEGER CHECK (sale_price IS NULL OR (sale_price > 0 AND sale_price < base_price)),
  gender            VARCHAR(10) NOT NULL DEFAULT 'unisex' CHECK (gender IN ('women', 'men', 'unisex')),
  status            VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id   INTEGER REFERENCES colors(id),
  url        TEXT NOT NULL,
  alt_text   VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id       INTEGER NOT NULL REFERENCES colors(id),
  size_id        INTEGER NOT NULL REFERENCES sizes(id),
  sku            VARCHAR(60) NOT NULL UNIQUE,
  price_override INTEGER CHECK (price_override IS NULL OR price_override > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  UNIQUE (product_id, color_id, size_id)
);

CREATE TABLE IF NOT EXISTS carts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(100) UNIQUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  UNIQUE (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(30) NOT NULL UNIQUE,
  discount_type    VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value            INTEGER NOT NULL CHECK (value > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_discount     INTEGER,
  usage_limit      INTEGER,
  used_count       INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(30) NOT NULL UNIQUE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(12) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')),
  payment_method   VARCHAR(15) NOT NULL CHECK (payment_method IN ('cod', 'bank_transfer', 'ewallet')),
  payment_status   VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  subtotal         INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee     INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount  INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total            INTEGER NOT NULL CHECK (total >= 0),
  coupon_id        INTEGER REFERENCES coupons(id),
  recipient_name   VARCHAR(120) NOT NULL,
  phone            VARCHAR(20) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id   UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  color_name   VARCHAR(50) NOT NULL,
  size_name    VARCHAR(20) NOT NULL,
  unit_price   INTEGER NOT NULL CHECK (unit_price > 0),
  quantity     INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
