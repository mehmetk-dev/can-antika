ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS product_slug VARCHAR(255),
    ADD COLUMN IF NOT EXISTS image_urls JSONB;

UPDATE order_items oi
SET product_slug = p.slug
FROM products p
WHERE oi.product_id = p.id
  AND oi.product_slug IS NULL;

UPDATE order_items oi
SET image_urls = imgs.urls
FROM (
    SELECT product_id, jsonb_agg(image_url ORDER BY image_url) AS urls
    FROM product_images
    GROUP BY product_id
) imgs
WHERE oi.product_id = imgs.product_id
  AND oi.image_urls IS NULL;
