-- Replace the generic accessory type with the supported accessory groups.
UPDATE products
SET product_type = CASE
  WHEN slug LIKE 'tui-%' THEN 'bag'
  WHEN slug LIKE 'non-%' OR slug LIKE 'mu-%' THEN 'hat'
  WHEN slug LIKE 'vi-%' THEN 'wallet'
  WHEN slug LIKE 'day-nit-%' OR slug LIKE 'that-lung-%' THEN 'belt'
  WHEN slug LIKE 'vo-%' THEN 'socks'
  WHEN slug LIKE 'dep-%' THEN 'sandals'
  WHEN slug LIKE 'giay-%' THEN 'shoes'
  WHEN slug LIKE 'gang-tay-%' THEN 'gloves'
  ELSE 'other'
END
WHERE product_type = 'accessories';
