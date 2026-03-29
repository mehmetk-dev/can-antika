-- Ürün sayfası performans indeksleri
-- slug araması: full table scan yerine index scan
CREATE INDEX IF NOT EXISTS idx_product_slug ON products(slug);

-- Kategori bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_product_category_id ON products(category_id);

-- Dönem bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_product_period_id ON products(period_id);

-- @ElementCollection product_images tablosu (N+1 sorgu hızlandırma)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
