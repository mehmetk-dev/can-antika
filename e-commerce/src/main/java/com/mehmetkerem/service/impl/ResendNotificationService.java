package com.mehmetkerem.service.impl;

import com.mehmetkerem.service.IEmailTemplateService;
import com.mehmetkerem.service.INotificationService;
import com.mehmetkerem.service.ISiteSettingsService;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("!test")
@ConditionalOnProperty(name = "resend.enabled", havingValue = "true", matchIfMissing = false)
public class ResendNotificationService implements INotificationService {

    private final Resend resend;
    private final String fromEmail;
    private final IEmailTemplateService emailTemplateService;
    private final ISiteSettingsService siteSettingsService;

    public ResendNotificationService(@Value("${resend.api.key}") String apiKey,
            @Value("${resend.from.email}") String fromEmail,
            IEmailTemplateService emailTemplateService,
            ISiteSettingsService siteSettingsService) {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
        this.emailTemplateService = emailTemplateService;
        this.siteSettingsService = siteSettingsService;
    }

    @Override
    @Async
    public void sendOrderConfirmation(String toEmail, String orderCode) {
        sendEmail(toEmail, "Sipariş Onayı - " + orderCode, emailTemplateService.renderOrderConfirmation(orderCode));
    }

    @Override
    @Async
    public void sendStockAlert(String productName, int currentStock) {
        log.warn("⚠️ Stok uyarısı: {} — kalan: {}", productName, currentStock);
        sendEmail(fromEmail, "⚠️ Stok Uyarısı: " + productName,
                emailTemplateService.renderStockAlert(productName, currentStock));
    }

    @Override
    @Async
    public void sendPasswordResetLink(String toEmail, String resetUrl) {
        sendEmail(toEmail, "Şifre Sıfırlama İsteği", emailTemplateService.renderPasswordReset(resetUrl));
    }

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String name) {
        sendEmail(toEmail, "Can Antika'ya Hoş Geldiniz!", emailTemplateService.renderWelcome(name));
    }

    @Override
    @Async
    public void sendOrderTrackingEmail(String toEmail, String orderCode, String trackingNumber, String carrier) {
        sendEmail(toEmail, "Siparişiniz Yola Çıktı! - " + orderCode,
                emailTemplateService.renderOrderTracking(orderCode, trackingNumber, carrier));
    }

    @Override
    @Async
    public void sendOrderStatusUpdate(String toEmail, String orderCode, String statusLabel) {
        sendEmail(toEmail, "Sipariş Durumu Güncellendi - " + orderCode,
                emailTemplateService.renderOrderStatusUpdate(orderCode, statusLabel));
    }

    @Override
    @Async
    public void sendContactFormNotification(String name, String email, String phone, String message) {
        String to = getAdminEmail();
        String subject = "İletişim Formu - " + name;
        String htmlBody = emailTemplateService.renderContactFormNotification(name, email, phone, message);
        sendEmail(to, subject, htmlBody);
    }

    @Override
    @Async
    public void sendAdminNotification(String subject, String htmlBody) {
        sendEmail(getAdminEmail(), subject, htmlBody);
    }

    private String getAdminEmail() {
        String adminEmail = siteSettingsService.get().getNotificationConfig().getAdminEmail();
        return (adminEmail != null && !adminEmail.isEmpty()) ? adminEmail : "destek@canantika.com";
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        CreateEmailOptions createEmailOptions = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(to)
                .subject(subject)
                .html(htmlContent)
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(createEmailOptions);
            log.info("Email sent successfully to {}: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send email via Resend to {}: {}", to, e.getMessage());
        }
    }
}
