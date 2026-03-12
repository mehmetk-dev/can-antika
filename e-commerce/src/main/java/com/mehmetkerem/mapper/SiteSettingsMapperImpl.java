package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.model.config.*;
import org.springframework.stereotype.Component;

@Component
public class SiteSettingsMapperImpl implements ISiteSettingsMapper {

    @Override
    public SiteSettingsResponse toAdminResponse(SiteSettings s) {
        StoreConfig store = s.getStoreConfig();
        ContactConfig contact = s.getContactConfig();
        ShippingConfig shipping = s.getShippingConfig();
        SocialConfig social = s.getSocialConfig();
        SeoConfig seo = s.getSeoConfig();
        MaintenanceConfig maint = s.getMaintenanceConfig();
        NotificationConfig notif = s.getNotificationConfig();
        PaymentConfig pay = s.getPaymentConfig();

        return SiteSettingsResponse.builder()
                .id(s.getId())
                // Store
                .storeName(store.getStoreName())
                .businessType(store.getBusinessType())
                .storeDescription(store.getStoreDescription())
                .companyName(store.getCompanyName())
                .taxId(store.getTaxId())
                .taxOffice(store.getTaxOffice())
                // Contact
                .phone(contact.getPhone())
                .email(contact.getEmail())
                .website(contact.getWebsite())
                .address(contact.getAddress())
                .whatsapp(contact.getWhatsapp())
                .weekdayHours(contact.getWeekdayHours())
                .saturdayHours(contact.getSaturdayHours())
                // Shipping
                .standardDelivery(shipping.getStandardDelivery())
                .expressDelivery(shipping.getExpressDelivery())
                .freeShippingMin(shipping.getFreeShippingMin())
                .shippingDurationDays(shipping.getShippingDurationDays())
                .expressShippingFee(shipping.getExpressShippingFee())
                // Social
                .facebook(social.getFacebook())
                .instagram(social.getInstagram())
                .twitter(social.getTwitter())
                .youtube(social.getYoutube())
                .tiktok(social.getTiktok())
                // SEO + Footer
                .metaTitle(seo.getMetaTitle())
                .metaDescription(seo.getMetaDescription())
                .metaKeywords(seo.getMetaKeywords())
                .googleAnalyticsId(seo.getGoogleAnalyticsId())
                .facebookPixelId(seo.getFacebookPixelId())
                .customHeadScripts(seo.getCustomHeadScripts())
                .footerAbout(seo.getFooterAbout())
                .footerCopyright(seo.getFooterCopyright())
                // Maintenance
                .maintenanceMode(maint.getMaintenanceMode())
                .maintenanceMessage(maint.getMaintenanceMessage())
                // Notification (SMTP — secrets masked)
                .smtpHost(notif.getSmtpHost())
                .smtpPort(notif.getSmtpPort())
                .smtpUsername(notif.getSmtpUsername())
                .smtpPassword(maskSecret(notif.getSmtpPassword()))
                .smtpFromEmail(notif.getSmtpFromEmail())
                .smtpFromName(notif.getSmtpFromName())
                // Notification (SMS — secrets masked)
                .smsProvider(notif.getSmsProvider())
                .smsApiKey(maskSecret(notif.getSmsApiKey()))
                .smsApiSecret(maskSecret(notif.getSmsApiSecret()))
                .smsSenderName(notif.getSmsSenderName())
                .smsEnabled(notif.getSmsEnabled())
                // Payment (secrets masked)
                .currency(pay.getCurrency())
                .currencySymbol(pay.getCurrencySymbol())
                .paymentProvider(pay.getPaymentProvider())
                .paymentApiKey(maskSecret(pay.getPaymentApiKey()))
                .paymentSecretKey(maskSecret(pay.getPaymentSecretKey()))
                .paymentMerchantId(pay.getPaymentMerchantId())
                .paymentTestMode(pay.getPaymentTestMode())
                .creditCardEnabled(pay.getCreditCardEnabled())
                .bankTransferEnabled(pay.getBankTransferEnabled())
                .cashOnDeliveryEnabled(pay.getCashOnDeliveryEnabled())
                .build();
    }

    @Override
    public SiteSettingsResponse toPublicResponse(SiteSettings s) {
        StoreConfig store = s.getStoreConfig();
        ContactConfig contact = s.getContactConfig();
        ShippingConfig shipping = s.getShippingConfig();
        SocialConfig social = s.getSocialConfig();
        SeoConfig seo = s.getSeoConfig();
        MaintenanceConfig maint = s.getMaintenanceConfig();
        PaymentConfig pay = s.getPaymentConfig();

        return SiteSettingsResponse.builder()
                .id(s.getId())
                // Store
                .storeName(store.getStoreName())
                .businessType(store.getBusinessType())
                .storeDescription(store.getStoreDescription())
                .companyName(store.getCompanyName())
                // Contact
                .phone(contact.getPhone())
                .email(contact.getEmail())
                .website(contact.getWebsite())
                .address(contact.getAddress())
                .whatsapp(contact.getWhatsapp())
                .weekdayHours(contact.getWeekdayHours())
                .saturdayHours(contact.getSaturdayHours())
                // Shipping
                .standardDelivery(shipping.getStandardDelivery())
                .expressDelivery(shipping.getExpressDelivery())
                .freeShippingMin(shipping.getFreeShippingMin())
                .shippingDurationDays(shipping.getShippingDurationDays())
                .expressShippingFee(shipping.getExpressShippingFee())
                // Social
                .facebook(social.getFacebook())
                .instagram(social.getInstagram())
                .twitter(social.getTwitter())
                .youtube(social.getYoutube())
                .tiktok(social.getTiktok())
                // SEO + Footer
                .metaTitle(seo.getMetaTitle())
                .metaDescription(seo.getMetaDescription())
                .metaKeywords(seo.getMetaKeywords())
                .googleAnalyticsId(seo.getGoogleAnalyticsId())
                .facebookPixelId(seo.getFacebookPixelId())
                .customHeadScripts(seo.getCustomHeadScripts())
                .footerAbout(seo.getFooterAbout())
                .footerCopyright(seo.getFooterCopyright())
                // Maintenance
                .maintenanceMode(maint.getMaintenanceMode())
                .maintenanceMessage(maint.getMaintenanceMessage())
                // Payment (sadece public bilgiler)
                .currency(pay.getCurrency())
                .currencySymbol(pay.getCurrencySymbol())
                .creditCardEnabled(pay.getCreditCardEnabled())
                .bankTransferEnabled(pay.getBankTransferEnabled())
                .cashOnDeliveryEnabled(pay.getCashOnDeliveryEnabled())
                .build();
    }

    @Override
    public void applyRequest(SiteSettings s, SiteSettingsRequest req) {
        applyStoreFields(s.getStoreConfig(), req);
        applyContactFields(s.getContactConfig(), req);
        applyShippingFields(s.getShippingConfig(), req);
        applySocialFields(s.getSocialConfig(), req);
        applySeoFields(s.getSeoConfig(), req);
        applyMaintenanceFields(s.getMaintenanceConfig(), req);
        applyNotificationFields(s.getNotificationConfig(), req);
        applyPaymentFields(s.getPaymentConfig(), req);
    }

    // ── Private helpers ──────────────────────────────────────────────

    private void applyStoreFields(StoreConfig c, SiteSettingsRequest r) {
        if (r.getStoreName() != null) c.setStoreName(r.getStoreName());
        if (r.getBusinessType() != null) c.setBusinessType(r.getBusinessType());
        if (r.getStoreDescription() != null) c.setStoreDescription(r.getStoreDescription());
        if (r.getCompanyName() != null) c.setCompanyName(r.getCompanyName());
        if (r.getTaxId() != null) c.setTaxId(r.getTaxId());
        if (r.getTaxOffice() != null) c.setTaxOffice(r.getTaxOffice());
    }

    private void applyContactFields(ContactConfig c, SiteSettingsRequest r) {
        if (r.getPhone() != null) c.setPhone(r.getPhone());
        if (r.getEmail() != null) c.setEmail(r.getEmail());
        if (r.getWebsite() != null) c.setWebsite(r.getWebsite());
        if (r.getAddress() != null) c.setAddress(r.getAddress());
        if (r.getWhatsapp() != null) c.setWhatsapp(r.getWhatsapp());
        if (r.getWeekdayHours() != null) c.setWeekdayHours(r.getWeekdayHours());
        if (r.getSaturdayHours() != null) c.setSaturdayHours(r.getSaturdayHours());
    }

    private void applyShippingFields(ShippingConfig c, SiteSettingsRequest r) {
        if (r.getStandardDelivery() != null) c.setStandardDelivery(r.getStandardDelivery());
        if (r.getExpressDelivery() != null) c.setExpressDelivery(r.getExpressDelivery());
        if (r.getFreeShippingMin() != null) c.setFreeShippingMin(r.getFreeShippingMin());
        if (r.getShippingDurationDays() != null) c.setShippingDurationDays(r.getShippingDurationDays());
        if (r.getExpressShippingFee() != null) c.setExpressShippingFee(r.getExpressShippingFee());
    }

    private void applySocialFields(SocialConfig c, SiteSettingsRequest r) {
        if (r.getFacebook() != null) c.setFacebook(r.getFacebook());
        if (r.getInstagram() != null) c.setInstagram(r.getInstagram());
        if (r.getTwitter() != null) c.setTwitter(r.getTwitter());
        if (r.getYoutube() != null) c.setYoutube(r.getYoutube());
        if (r.getTiktok() != null) c.setTiktok(r.getTiktok());
    }

    private void applySeoFields(SeoConfig c, SiteSettingsRequest r) {
        if (r.getMetaTitle() != null) c.setMetaTitle(r.getMetaTitle());
        if (r.getMetaDescription() != null) c.setMetaDescription(r.getMetaDescription());
        if (r.getMetaKeywords() != null) c.setMetaKeywords(r.getMetaKeywords());
        if (r.getGoogleAnalyticsId() != null) c.setGoogleAnalyticsId(r.getGoogleAnalyticsId());
        if (r.getFacebookPixelId() != null) c.setFacebookPixelId(r.getFacebookPixelId());
        // customHeadScripts devre dışı — Stored XSS riski (AUDIT C2)
        if (r.getFooterAbout() != null) c.setFooterAbout(r.getFooterAbout());
        if (r.getFooterCopyright() != null) c.setFooterCopyright(r.getFooterCopyright());
    }

    private void applyMaintenanceFields(MaintenanceConfig c, SiteSettingsRequest r) {
        if (r.getMaintenanceMode() != null) c.setMaintenanceMode(r.getMaintenanceMode());
        if (r.getMaintenanceMessage() != null) c.setMaintenanceMessage(r.getMaintenanceMessage());
    }

    private void applyNotificationFields(NotificationConfig c, SiteSettingsRequest r) {
        if (r.getSmtpHost() != null) c.setSmtpHost(r.getSmtpHost());
        if (r.getSmtpPort() != null) c.setSmtpPort(r.getSmtpPort());
        if (r.getSmtpUsername() != null) c.setSmtpUsername(r.getSmtpUsername());
        if (r.getSmtpPassword() != null) c.setSmtpPassword(r.getSmtpPassword());
        if (r.getSmtpFromEmail() != null) c.setSmtpFromEmail(r.getSmtpFromEmail());
        if (r.getSmtpFromName() != null) c.setSmtpFromName(r.getSmtpFromName());
        if (r.getSmsProvider() != null) c.setSmsProvider(r.getSmsProvider());
        if (r.getSmsApiKey() != null) c.setSmsApiKey(r.getSmsApiKey());
        if (r.getSmsApiSecret() != null) c.setSmsApiSecret(r.getSmsApiSecret());
        if (r.getSmsSenderName() != null) c.setSmsSenderName(r.getSmsSenderName());
        if (r.getSmsEnabled() != null) c.setSmsEnabled(r.getSmsEnabled());
    }

    private void applyPaymentFields(PaymentConfig c, SiteSettingsRequest r) {
        if (r.getCurrency() != null) c.setCurrency(r.getCurrency());
        if (r.getCurrencySymbol() != null) c.setCurrencySymbol(r.getCurrencySymbol());
        if (r.getPaymentProvider() != null) c.setPaymentProvider(r.getPaymentProvider());
        if (r.getPaymentApiKey() != null) c.setPaymentApiKey(r.getPaymentApiKey());
        if (r.getPaymentSecretKey() != null) c.setPaymentSecretKey(r.getPaymentSecretKey());
        if (r.getPaymentMerchantId() != null) c.setPaymentMerchantId(r.getPaymentMerchantId());
        if (r.getPaymentTestMode() != null) c.setPaymentTestMode(r.getPaymentTestMode());
        if (r.getCreditCardEnabled() != null) c.setCreditCardEnabled(r.getCreditCardEnabled());
        if (r.getBankTransferEnabled() != null) c.setBankTransferEnabled(r.getBankTransferEnabled());
        if (r.getCashOnDeliveryEnabled() != null) c.setCashOnDeliveryEnabled(r.getCashOnDeliveryEnabled());
    }

    private static String maskSecret(String value) {
        if (value == null || value.isBlank()) return value;
        if (value.length() <= 4) return "****";
        return "****" + value.substring(value.length() - 4);
    }
}
