UPDATE site_settings
SET address = 'Hüseyinağa Mah. Meşrutiyet Cad. Avrupa Pasajı No: 8 İç Kapı No: 7 Beyoğlu / İstanbul'
WHERE address IN (
    'Çukurcuma Caddesi No: 45, Beyoğlu, İstanbul',
    'Avrupa Pasajı, Beyoğlu / İstanbul'
)
   OR address ILIKE '%Avrupa pasajı No:7%'
   OR address ILIKE '%Avrupa Pasajı No: 7%';

UPDATE site_settings
SET store_description = '1982''den gelen aile tecrübesiyle Can Antika çatısı altında seçkin antika ve koleksiyon ürünleri sunuyoruz.'
WHERE store_description = '1982''den beri İstanbul''da en kaliteli antika eşyaları sunuyoruz.'
   OR store_description = '1982''den beri İstanbul''un kalbinde, geçmişin eşsiz güzelliklerini geleceğe taşıyoruz.';

UPDATE site_settings
SET meta_description = '1982''den gelen aile tecrübesiyle Can Antika çatısı altında seçkin antika ve koleksiyon ürünleri.'
WHERE meta_description = '1982''den beri İstanbul''da en kaliteli antika eşyaları.';

UPDATE site_settings
SET footer_about = 'Can Antika, 1982''den gelen aile tecrübesiyle seçkin antika ve koleksiyon ürünleri sunmaktadır.'
WHERE footer_about = 'Can Antika, 1982''den beri İstanbul''un kalbinde nadide antika eşyalar sunmaktadır.'
   OR footer_about = '1982''den beri İstanbul''un kalbinde, geçmişin eşsiz güzelliklerini geleceğe taşıyoruz.';
