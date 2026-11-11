-- Run once after the existing reviews table has been created.
-- Existing customer reviews remain visible when this column is added.
ALTER TABLE reviews
  ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1 AFTER comment,
  ADD KEY idx_reviews_product_visible_created (product_id, is_visible, created_at),
  ADD KEY idx_reviews_visibility_created (is_visible, created_at);

DELIMITER $$
CREATE TRIGGER trg_reviews_visibility_bi BEFORE INSERT ON reviews FOR EACH ROW
BEGIN
  IF NEW.is_visible NOT IN (0, 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'review visibility must be 0 or 1';
  END IF;
END$$
CREATE TRIGGER trg_reviews_visibility_bu BEFORE UPDATE ON reviews FOR EACH ROW
BEGIN
  IF NEW.is_visible NOT IN (0, 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'review visibility must be 0 or 1';
  END IF;
END$$
DELIMITER ;
