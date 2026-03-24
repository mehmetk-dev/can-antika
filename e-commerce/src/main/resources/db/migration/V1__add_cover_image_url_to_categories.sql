ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);
