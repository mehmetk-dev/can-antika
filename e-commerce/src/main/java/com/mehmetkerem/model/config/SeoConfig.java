package com.mehmetkerem.model.config;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeoConfig {

    private String metaTitle = "Can Antika | İstanbul Antika ve Koleksiyon Mağazası";

    @Column(length = 500)
    private String metaDescription = "Can Antika, Beyoğlu Avrupa Pasajı'nda antika ve koleksiyon ürünleri sunar. Ürünleri, fiyatları, teslimat ve iade koşullarını siteden inceleyebilirsiniz.";

    private String metaKeywords = "antika, koleksiyon, osmanlı, vintage";

    private String googleAnalyticsId = "";

    private String facebookPixelId = "";

    @Column(length = 2000)
    private String customHeadScripts = "";

    @Column(length = 1000)
    private String footerAbout = "Can Antika, 1982'den gelen aile tecrübesiyle seçkin antika ve koleksiyon ürünleri sunmaktadır.";

    private String footerCopyright = "© 2024 Can Antika. Tüm hakları saklıdır.";
}
