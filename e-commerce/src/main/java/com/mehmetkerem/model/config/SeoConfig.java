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

    private String metaTitle = "Can Antika - Premium Antika Eşya Satışı İstanbul";

    @Column(length = 500)
    private String metaDescription = "1989'den beri İstanbul'da en kaliteli antika eşyaları.";

    private String metaKeywords = "antika, koleksiyon, osmanlı, vintage";

    private String googleAnalyticsId = "";

    private String facebookPixelId = "";

    @Column(length = 2000)
    private String customHeadScripts = "";

    @Column(length = 1000)
    private String footerAbout = "Can Antika, 1989'den beri İstanbul'un kalbinde nadide antika eşyalar sunmaktadır.";

    private String footerCopyright = "© 2024 Can Antika. Tüm hakları saklıdır.";
}
