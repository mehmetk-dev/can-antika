package com.mehmetkerem.service.impl;

import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.repository.SiteSettingsRepository;
import com.mehmetkerem.service.ISiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SiteSettingsService implements ISiteSettingsService {

    private final SiteSettingsRepository repository;

    /**
     * Tek satır döndürür; yoksa default değerlerle oluşturur.
     */
    @Override
    public SiteSettings get() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(SiteSettings.builder().build()));
    }

    @Override
    @Transactional
    public SiteSettings update(SiteSettings incoming) {
        SiteSettings existing = get();

        // Mağaza
        existing.setStoreName(incoming.getStoreName());
        existing.setBusinessType(incoming.getBusinessType());
        existing.setStoreDescription(incoming.getStoreDescription());

        // Firma
        existing.setCompanyName(incoming.getCompanyName());
        existing.setTaxId(incoming.getTaxId());
        existing.setTaxOffice(incoming.getTaxOffice());

        // İletişim
        existing.setPhone(incoming.getPhone());
        existing.setEmail(incoming.getEmail());
        existing.setWebsite(incoming.getWebsite());
        existing.setAddress(incoming.getAddress());
        existing.setWhatsapp(incoming.getWhatsapp());
        existing.setWeekdayHours(incoming.getWeekdayHours());
        existing.setSaturdayHours(incoming.getSaturdayHours());

        // Teslimat
        existing.setStandardDelivery(incoming.getStandardDelivery());
        existing.setExpressDelivery(incoming.getExpressDelivery());
        existing.setFreeShippingMin(incoming.getFreeShippingMin());
        existing.setShippingDurationDays(incoming.getShippingDurationDays());
        existing.setExpressShippingFee(incoming.getExpressShippingFee());

        // Sosyal Medya
        existing.setFacebook(incoming.getFacebook());
        existing.setInstagram(incoming.getInstagram());
        existing.setTwitter(incoming.getTwitter());
        existing.setYoutube(incoming.getYoutube());
        existing.setTiktok(incoming.getTiktok());

        // SEO
        existing.setMetaTitle(incoming.getMetaTitle());
        existing.setMetaDescription(incoming.getMetaDescription());
        existing.setMetaKeywords(incoming.getMetaKeywords());
        existing.setGoogleAnalyticsId(incoming.getGoogleAnalyticsId());
        existing.setFacebookPixelId(incoming.getFacebookPixelId());
        // customHeadScripts devre dışı — Stored XSS riski (AUDIT C2)
        // existing.setCustomHeadScripts(incoming.getCustomHeadScripts());

        // Footer
        existing.setFooterAbout(incoming.getFooterAbout());
        existing.setFooterCopyright(incoming.getFooterCopyright());

        // Bakım Modu
        existing.setMaintenanceMode(incoming.getMaintenanceMode());
        existing.setMaintenanceMessage(incoming.getMaintenanceMessage());

        // SMTP
        existing.setSmtpHost(incoming.getSmtpHost());
        existing.setSmtpPort(incoming.getSmtpPort());
        existing.setSmtpUsername(incoming.getSmtpUsername());
        existing.setSmtpPassword(incoming.getSmtpPassword());
        existing.setSmtpFromEmail(incoming.getSmtpFromEmail());
        existing.setSmtpFromName(incoming.getSmtpFromName());

        // Para Birimi
        existing.setCurrency(incoming.getCurrency());
        existing.setCurrencySymbol(incoming.getCurrencySymbol());

        // SMS
        existing.setSmsProvider(incoming.getSmsProvider());
        existing.setSmsApiKey(incoming.getSmsApiKey());
        existing.setSmsApiSecret(incoming.getSmsApiSecret());
        existing.setSmsSenderName(incoming.getSmsSenderName());
        existing.setSmsEnabled(incoming.getSmsEnabled());

        // Ödeme
        existing.setPaymentProvider(incoming.getPaymentProvider());
        existing.setPaymentApiKey(incoming.getPaymentApiKey());
        existing.setPaymentSecretKey(incoming.getPaymentSecretKey());
        existing.setPaymentMerchantId(incoming.getPaymentMerchantId());
        existing.setPaymentTestMode(incoming.getPaymentTestMode());
        existing.setCreditCardEnabled(incoming.getCreditCardEnabled());
        existing.setBankTransferEnabled(incoming.getBankTransferEnabled());
        existing.setCashOnDeliveryEnabled(incoming.getCashOnDeliveryEnabled());

        return repository.save(existing);
    }
}
