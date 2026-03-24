CREATE TABLE IF NOT EXISTS periods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS period_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_products_period_id'
          AND table_name = 'products'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_period_id
            FOREIGN KEY (period_id)
            REFERENCES periods (id);
    END IF;
END $$;
