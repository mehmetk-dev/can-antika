package com.mehmetkerem.controller.impl;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.service.ISiteSettingsService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/site-settings")
@RequiredArgsConstructor
public class RestSiteSettingsController implements com.mehmetkerem.controller.IRestSiteSettingsController {

    private final ISiteSettingsService service;

    private static String maskSecret(String value) {
        if (value == null || value.isBlank()) return value;
        if (value.length() <= 4) return "****";
        return "****" + value.substring(value.length() - 4);
    }

    private SiteSettingsResponse toResponse(SiteSettings s) {
        return SiteSettingsResponse.builder()
                .id(s.getId())
                .storeName(s.getStoreName())
                .businessType(s.getBusinessType())
                .storeDescription(s.getStoreDescription())
                .companyName(s.getCompanyName())
                .taxId(s.getTaxId())
                .taxOffice(s.getTaxOffice())
                .phone(s.getPhone())
                .email(s.getEmail())
                .website(s.getWebsite())
                .address(s.getAddress())
                .whatsapp(s.getWhatsapp())
                .weekdayHours(s.getWeekdayHours())
                .saturdayHours(s.getSaturdayHours())
                .standardDelivery(s.getStandardDelivery())
                .expressDelivery(s.getExpressDelivery())
                .freeShippingMin(s.getFreeShippingMin())
                .shippingDurationDays(s.getShippingDurationDays())
                .expressShippingFee(s.getExpressShippingFee())
                .facebook(s.getFacebook())
                .instagram(s.getInstagram())
                .twitter(s.getTwitter())
                .youtube(s.getYoutube())
                .tiktok(s.getTiktok())
                .metaTitle(s.getMetaTitle())
                .metaDescription(s.getMetaDescription())
                .metaKeywords(s.getMetaKeywords())
                .googleAnalyticsId(s.getGoogleAnalyticsId())
                .facebookPixelId(s.getFacebookPixelId())
                .customHeadScripts(s.getCustomHeadScripts())
                .footerAbout(s.getFooterAbout())
                .footerCopyright(s.getFooterCopyright())
                .maintenanceMode(s.getMaintenanceMode())
                .maintenanceMessage(s.getMaintenanceMessage())
                .smtpHost(s.getSmtpHost())
                .smtpPort(s.getSmtpPort())
                .smtpUsername(s.getSmtpUsername())
                .smtpPassword(maskSecret(s.getSmtpPassword()))
                .smtpFromEmail(s.getSmtpFromEmail())
                .smtpFromName(s.getSmtpFromName())
                .currency(s.getCurrency())
                .currencySymbol(s.getCurrencySymbol())
                .smsProvider(s.getSmsProvider())
                .smsApiKey(maskSecret(s.getSmsApiKey()))
                .smsApiSecret(maskSecret(s.getSmsApiSecret()))
                .smsSenderName(s.getSmsSenderName())
                .smsEnabled(s.getSmsEnabled())
                .paymentProvider(s.getPaymentProvider())
                .paymentApiKey(maskSecret(s.getPaymentApiKey()))
                .paymentSecretKey(maskSecret(s.getPaymentSecretKey()))
                .paymentMerchantId(s.getPaymentMerchantId())
                .paymentTestMode(s.getPaymentTestMode())
                .creditCardEnabled(s.getCreditCardEnabled())
                .bankTransferEnabled(s.getBankTransferEnabled())
                .cashOnDeliveryEnabled(s.getCashOnDeliveryEnabled())
                .build();
    }

    private void applyRequest(SiteSettings s, SiteSettingsRequest req) {
        if (req.getStoreName() != null) s.setStoreName(req.getStoreName());
        if (req.getBusinessType() != null) s.setBusinessType(req.getBusinessType());
        if (req.getStoreDescription() != null) s.setStoreDescription(req.getStoreDescription());
        if (req.getCompanyName() != null) s.setCompanyName(req.getCompanyName());
        if (req.getTaxId() != null) s.setTaxId(req.getTaxId());
        if (req.getTaxOffice() != null) s.setTaxOffice(req.getTaxOffice());
        if (req.getPhone() != null) s.setPhone(req.getPhone());
        if (req.getEmail() != null) s.setEmail(req.getEmail());
        if (req.getWebsite() != null) s.setWebsite(req.getWebsite());
        if (req.getAddress() != null) s.setAddress(req.getAddress());
        if (req.getWhatsapp() != null) s.setWhatsapp(req.getWhatsapp());
        if (req.getWeekdayHours() != null) s.setWeekdayHours(req.getWeekdayHours());
        if (req.getSaturdayHours() != null) s.setSaturdayHours(req.getSaturdayHours());
        if (req.getStandardDelivery() != null) s.setStandardDelivery(req.getStandardDelivery());
        if (req.getExpressDelivery() != null) s.setExpressDelivery(req.getExpressDelivery());
        if (req.getFreeShippingMin() != null) s.setFreeShippingMin(req.getFreeShippingMin());
        if (req.getShippingDurationDays() != null) s.setShippingDurationDays(req.getShippingDurationDays());
        if (req.getExpressShippingFee() != null) s.setExpressShippingFee(req.getExpressShippingFee());
        if (req.getFacebook() != null) s.setFacebook(req.getFacebook());
        if (req.getInstagram() != null) s.setInstagram(req.getInstagram());
        if (req.getTwitter() != null) s.setTwitter(req.getTwitter());
        if (req.getYoutube() != null) s.setYoutube(req.getYoutube());
        if (req.getTiktok() != null) s.setTiktok(req.getTiktok());
        if (req.getMetaTitle() != null) s.setMetaTitle(req.getMetaTitle());
        if (req.getMetaDescription() != null) s.setMetaDescription(req.getMetaDescription());
        if (req.getMetaKeywords() != null) s.setMetaKeywords(req.getMetaKeywords());
        if (req.getGoogleAnalyticsId() != null) s.setGoogleAnalyticsId(req.getGoogleAnalyticsId());
        if (req.getFacebookPixelId() != null) s.setFacebookPixelId(req.getFacebookPixelId());
        if (req.getCustomHeadScripts() != null) s.setCustomHeadScripts(req.getCustomHeadScripts());
        if (req.getFooterAbout() != null) s.setFooterAbout(req.getFooterAbout());
        if (req.getFooterCopyright() != null) s.setFooterCopyright(req.getFooterCopyright());
        if (req.getMaintenanceMode() != null) s.setMaintenanceMode(req.getMaintenanceMode());
        if (req.getMaintenanceMessage() != null) s.setMaintenanceMessage(req.getMaintenanceMessage());
        if (req.getSmtpHost() != null) s.setSmtpHost(req.getSmtpHost());
        if (req.getSmtpPort() != null) s.setSmtpPort(req.getSmtpPort());
        if (req.getSmtpUsername() != null) s.setSmtpUsername(req.getSmtpUsername());
        if (req.getSmtpPassword() != null) s.setSmtpPassword(req.getSmtpPassword());
        if (req.getSmtpFromEmail() != null) s.setSmtpFromEmail(req.getSmtpFromEmail());
        if (req.getSmtpFromName() != null) s.setSmtpFromName(req.getSmtpFromName());
        if (req.getCurrency() != null) s.setCurrency(req.getCurrency());
        if (req.getCurrencySymbol() != null) s.setCurrencySymbol(req.getCurrencySymbol());
        if (req.getSmsProvider() != null) s.setSmsProvider(req.getSmsProvider());
        if (req.getSmsApiKey() != null) s.setSmsApiKey(req.getSmsApiKey());
        if (req.getSmsApiSecret() != null) s.setSmsApiSecret(req.getSmsApiSecret());
        if (req.getSmsSenderName() != null) s.setSmsSenderName(req.getSmsSenderName());
        if (req.getSmsEnabled() != null) s.setSmsEnabled(req.getSmsEnabled());
        if (req.getPaymentProvider() != null) s.setPaymentProvider(req.getPaymentProvider());
        if (req.getPaymentApiKey() != null) s.setPaymentApiKey(req.getPaymentApiKey());
        if (req.getPaymentSecretKey() != null) s.setPaymentSecretKey(req.getPaymentSecretKey());
        if (req.getPaymentMerchantId() != null) s.setPaymentMerchantId(req.getPaymentMerchantId());
        if (req.getPaymentTestMode() != null) s.setPaymentTestMode(req.getPaymentTestMode());
        if (req.getCreditCardEnabled() != null) s.setCreditCardEnabled(req.getCreditCardEnabled());
        if (req.getBankTransferEnabled() != null) s.setBankTransferEnabled(req.getBankTransferEnabled());
        if (req.getCashOnDeliveryEnabled() != null) s.setCashOnDeliveryEnabled(req.getCashOnDeliveryEnabled());
    }

    /**
     * Public response — hassas alanlar dahil EDİLMEZ.
     * SMTP şifreleri, ödeme API anahtarları, SMS gizli anahtarları herkese açık DEĞİLDİR.
     */
    private SiteSettingsResponse toPublicResponse(SiteSettings s) {
        return SiteSettingsResponse.builder()
                .id(s.getId())
                .storeName(s.getStoreName())
                .businessType(s.getBusinessType())
                .storeDescription(s.getStoreDescription())
                .companyName(s.getCompanyName())
                .phone(s.getPhone())
                .email(s.getEmail())
                .website(s.getWebsite())
                .address(s.getAddress())
                .whatsapp(s.getWhatsapp())
                .weekdayHours(s.getWeekdayHours())
                .saturdayHours(s.getSaturdayHours())
                .standardDelivery(s.getStandardDelivery())
                .expressDelivery(s.getExpressDelivery())
                .freeShippingMin(s.getFreeShippingMin())
                .shippingDurationDays(s.getShippingDurationDays())
                .expressShippingFee(s.getExpressShippingFee())
                .facebook(s.getFacebook())
                .instagram(s.getInstagram())
                .twitter(s.getTwitter())
                .youtube(s.getYoutube())
                .tiktok(s.getTiktok())
                .metaTitle(s.getMetaTitle())
                .metaDescription(s.getMetaDescription())
                .metaKeywords(s.getMetaKeywords())
                .googleAnalyticsId(s.getGoogleAnalyticsId())
                .facebookPixelId(s.getFacebookPixelId())
                .customHeadScripts(s.getCustomHeadScripts())
                .footerAbout(s.getFooterAbout())
                .footerCopyright(s.getFooterCopyright())
                .maintenanceMode(s.getMaintenanceMode())
                .maintenanceMessage(s.getMaintenanceMessage())
                .currency(s.getCurrency())
                .currencySymbol(s.getCurrencySymbol())
                .creditCardEnabled(s.getCreditCardEnabled())
                .bankTransferEnabled(s.getBankTransferEnabled())
                .cashOnDeliveryEnabled(s.getCashOnDeliveryEnabled())
                .build();
    }

    /** Public endpoint — hassas alanlar gizlenir */
    @GetMapping
    public ResultData<SiteSettingsResponse> get() {
        return ResultHelper.success(toPublicResponse(service.get()));
    }

    /** Admin endpoint — tüm alanlar (SMTP, ödeme, SMS dahil) */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResultData<SiteSettingsResponse> getAdmin() {
        return ResultHelper.success(toResponse(service.get()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResultData<SiteSettingsResponse> update(@RequestBody SiteSettingsRequest req) {
        SiteSettings existing = service.get();
        applyRequest(existing, req);
        return ResultHelper.success(toResponse(service.update(existing)));
    }
}
