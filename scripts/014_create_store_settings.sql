-- Run once. Creates the editable storefront settings singleton.
CREATE TABLE store_settings (
  id TINYINT UNSIGNED NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  hotline VARCHAR(30) NOT NULL,
  store_address VARCHAR(255) NOT NULL,
  shipping_fee INT UNSIGNED NOT NULL DEFAULT 30000,
  free_shipping_threshold INT UNSIGNED NOT NULL DEFAULT 1000000,
  return_days SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  return_policy TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO store_settings
  (id, tagline, hotline, store_address, shipping_fee, free_shipping_threshold, return_days, return_policy)
VALUES
  (1, 'Thời trang tối giản từ chất liệu tự nhiên. Thiết kế tại Sài Gòn, may thủ công bởi những người thợ Việt.',
   '02838505520', '180 Cao Lỗ, Phường Chánh Hưng, Hồ Chí Minh, Việt Nam', 30000, 1000000, 30,
   'Khách hàng được hỗ trợ đổi trả trong vòng 30 ngày. Đổi size hoặc trả hàng theo điều kiện áp dụng của cửa hàng.');
