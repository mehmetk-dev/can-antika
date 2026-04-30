ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

WITH ordered_products AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id DESC) AS row_number
    FROM products
    WHERE created_at IS NULL
)
UPDATE products
SET created_at = NOW() - ((ordered_products.row_number - 1) * INTERVAL '1 second')
FROM ordered_products
WHERE products.id = ordered_products.id;

ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE products ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_created_at_id ON products (created_at DESC, id DESC);
