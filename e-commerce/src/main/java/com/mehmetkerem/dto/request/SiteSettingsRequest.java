package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSettingsRequest {
    private String storeName;
    private String businessType;
    private String storeDescription;
    private String companyName;
    private String taxId;
    private String taxOffice;
    private String phone;
    private String email;
    private String website;
    private String address;
    private String whatsapp;
    private String weekdayHours;
    private String saturdayHours;
    private String standardDelivery;
    private String expressDelivery;
    private Integer freeShippingMin;
    private Integer shippingDurationDays;
    private Integer expressShippingFee;
    private String facebook;
    private String instagram;
    private String twitter;
    private String youtube;
    private String tiktok;
    private String metaTitle;
    private String metaDescription;
    private String metaKeywords;
    private String googleAnalyticsId;
    private String facebookPixelId;
    private String customHeadScripts;
    private String footerAbout;
    private String footerCopyright;
    private Boolean maintenanceMode;
    private String maintenanceMessage;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String smtpFromEmail;
    private String smtpFromName;
    private String currency;
    private String currencySymbol;
    private String smsProvider;
    private String smsApiKey;
    private String smsApiSecret;
    private String smsSenderName;
    private Boolean smsEnabled;
    private String paymentProvider;
    private String paymentApiKey;
    private String paymentSecretKey;
    private String paymentMerchantId;
    private Boolean paymentTestMode;
    private Boolean creditCardEnabled;
    private Boolean bankTransferEnabled;
    private Boolean cashOnDeliveryEnabled;
}
