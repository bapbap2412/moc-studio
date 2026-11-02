-- Expand payment_method so existing databases can store the new SePay value.
-- Existing payment method values are preserved.
ALTER TABLE orders
  MODIFY COLUMN payment_method VARCHAR(15) NOT NULL;
