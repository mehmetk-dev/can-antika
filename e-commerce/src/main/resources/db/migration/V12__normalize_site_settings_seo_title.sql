UPDATE site_settings
SET meta_title = 'Can Antika | İstanbul Antika ve Koleksiyon Mağazası'
WHERE meta_title IS NULL
   OR btrim(meta_title) = ''
   OR length(meta_title) > 70
   OR meta_title ILIKE '%destek@canantika.com%'
   OR meta_title ILIKE '%507 687%'
   OR meta_title ILIKE '%Hüseyinağa%'
   OR meta_title ILIKE '%Meşrutiyet%'
   OR meta_title ILIKE '%Avrupa Pasajı%'
   OR meta_title ILIKE '%Premium Antika Eşya Satışı İstanbul%'
   OR meta_title ILIKE '%1982''den beri İstanbul''da en kaliteli antika eşyaları%';

UPDATE site_settings
SET meta_description = 'Can Antika, Beyoğlu Avrupa Pasajı''nda antika ve koleksiyon ürünleri sunar. Ürünleri, fiyatları, teslimat ve iade koşullarını siteden inceleyebilirsiniz.'
WHERE meta_description IS NULL
   OR btrim(meta_description) = ''
   OR length(meta_description) > 160
   OR meta_description ILIKE '%destek@canantika.com%'
   OR meta_description ILIKE '%507 687%'
   OR meta_description ILIKE '%Hüseyinağa%'
   OR meta_description ILIKE '%Meşrutiyet%';
