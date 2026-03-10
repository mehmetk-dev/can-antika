package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@Entity
@Table(name = "site_settings")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mağaza
    @Builder.Default
    private String storeName = "Can Antika";
    @Builder.Default
    private String businessType = "Antika Eşya Satışı";
    @Builder.Default
    @Column(length = 500)
    private String storeDescription = "1989'den beri İstanbul'da en kaliteli antika eşyaları sunuyoruz.";

    // Firma
    @Builder.Default
    private String companyName = "Can Antika Ltd. Şti.";
    @Builder.Default
    private String taxId = "";
    @Builder.Default
    private String taxOffice = "";

    // İletişim
    @Builder.Default
    private String phone = "+90 (212) 555-0123";
    @Builder.Default
    private String email = "info@canantika.com";
    @Builder.Default
    private String website = "www.canantika.com";
    @Builder.Default
    @Column(length = 500)
    private String address = "Çukurcuma Caddesi No: 45, Beyoğlu, İstanbul";
    @Builder.Default
    private String whatsapp = "+90 (212) 555-0123";

    // Çalışma Saatleri
    @Builder.Default
    private String weekdayHours = "10:00 - 18:00";
    @Builder.Default
    private String saturdayHours = "11:00 - 17:00";

    // Teslimat
    @Builder.Default
    private String standardDelivery = "3-5 iş günü";
    @Builder.Default
    private String expressDelivery = "1-2 iş günü";
    @Builder.Default
    private Integer freeShippingMin = 500;
    @Builder.Default
    private Integer shippingDurationDays = 5;
    @Builder.Default
    private Integer expressShippingFee = 50;

    // Sosyal Medya
    @Builder.Default
    private String facebook = "";
    @Builder.Default
    private String instagram = "";
    @Builder.Default
    private String twitter = "";
    @Builder.Default
    private String youtube = "";
    @Builder.Default
    private String tiktok = "";

    // SEO
    @Builder.Default
    private String metaTitle = "Can Antika - Premium Antika Eşya Satışı İstanbul";
    @Builder.Default
    @Column(length = 500)
    private String metaDescription = "1989'den beri İstanbul'da en kaliteli antika eşyaları.";
    @Builder.Default
    private String metaKeywords = "antika, koleksiyon, osmanlı, vintage";
    @Builder.Default
    private String googleAnalyticsId = "";
    @Builder.Default
    private String facebookPixelId = "";
    @Builder.Default
    @Column(length = 2000)
    private String customHeadScripts = "";

    // Footer
    @Builder.Default
    @Column(length = 1000)
    private String footerAbout = "Can Antika, 1989'den beri İstanbul'un kalbinde nadide antika eşyalar sunmaktadır.";
    @Builder.Default
    private String footerCopyright = "© 2024 Can Antika. Tüm hakları saklıdır.";

    // Bakım Modu
    @Builder.Default
    private Boolean maintenanceMode = false;
    @Builder.Default
    @Column(length = 500)
    private String maintenanceMessage = "Sitemiz bakım modundadır, kısa süre içinde tekrar hizmetinizde olacağız.";

    // SMTP
    @Builder.Default
    private String smtpHost = "";
    @Builder.Default
    private Integer smtpPort = 587;
    @Builder.Default
    private String smtpUsername = "";
    @Builder.Default
    private String smtpPassword = "";
    @Builder.Default
    private String smtpFromEmail = "";
    @Builder.Default
    private String smtpFromName = "Can Antika";

    // Para Birimi
    @Builder.Default
    private String currency = "TRY";
    @Builder.Default
    private String currencySymbol = "₺";

    // SMS
    @Builder.Default
    private String smsProvider = "";
    @Builder.Default
    private String smsApiKey = "";
    @Builder.Default
    private String smsApiSecret = "";
    @Builder.Default
    private String smsSenderName = "";
    @Builder.Default
    private Boolean smsEnabled = false;

    // Ödeme
    @Builder.Default
    private String paymentProvider = "";
    @Builder.Default
    private String paymentApiKey = "";
    @Builder.Default
    private String paymentSecretKey = "";
    @Builder.Default
    private String paymentMerchantId = "";
    @Builder.Default
    private Boolean paymentTestMode = true;
    @Builder.Default
    private Boolean creditCardEnabled = true;
    @Builder.Default
    private Boolean bankTransferEnabled = true;
    @Builder.Default
    private Boolean cashOnDeliveryEnabled = false;
}
