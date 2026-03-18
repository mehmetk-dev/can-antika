package com.mehmetkerem.service.impl;

import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.model.config.NotificationConfig;
import com.mehmetkerem.service.IEmailTemplateService;
import com.mehmetkerem.service.INotificationService;
import com.mehmetkerem.service.ISiteSettingsService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Slf4j
@Service
@Primary
@Profile("!test")
public class SmtpNotificationService implements INotificationService {

    private final ISiteSettingsService siteSettingsService;
    private final IEmailTemplateService emailTemplateService;

    private final String defaultHost;
    private final Integer defaultPort;
    private final String defaultUser;
    private final String defaultPass;
    private final String defaultFrom;

    public SmtpNotificationService(
            ISiteSettingsService siteSettingsService,
            IEmailTemplateService emailTemplateService,
            @Value("${spring.mail.host:smtp.zoho.com}") String defaultHost,
            @Value("${spring.mail.port:465}") Integer defaultPort,
            @Value("${spring.mail.username:}") String defaultUser,
            @Value("${spring.mail.password:}") String defaultPass,
            @Value("${spring.mail.from.email:}") String defaultFrom) {
        this.siteSettingsService = siteSettingsService;
        this.emailTemplateService = emailTemplateService;
        this.defaultHost = defaultHost;
        this.defaultPort = defaultPort;
        this.defaultUser = defaultUser;
        this.defaultPass = defaultPass;
        this.defaultFrom = defaultFrom;
    }

    @Override
    @Async
    public void sendOrderConfirmation(String toEmail, String orderCode) {
        sendEmail(toEmail, "Sipariş Onayı - " + orderCode, emailTemplateService.renderOrderConfirmation(orderCode));
    }

    @Override
    @Async
    public void sendStockAlert(String productName, int currentStock) {
        String fromEmail = siteSettingsService.get().getNotificationConfig().getSmtpFromEmail();
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

    private void sendEmail(String to, String subject, String htmlContent) {
        SiteSettings settings = siteSettingsService.get();
        NotificationConfig config = settings.getNotificationConfig();

        // Use DB values if present, otherwise use defaults from application.properties
        String host = (config.getSmtpHost() != null && !config.getSmtpHost().isEmpty()) ? config.getSmtpHost() : defaultHost;
        Integer port = (config.getSmtpPort() != null && config.getSmtpPort() != 0) ? config.getSmtpPort() : defaultPort;
        String user = (config.getSmtpUsername() != null && !config.getSmtpUsername().isEmpty()) ? config.getSmtpUsername() : defaultUser;
        String pass = (config.getSmtpPassword() != null && !config.getSmtpPassword().isEmpty()) ? config.getSmtpPassword() : defaultPass;
        String from = (config.getSmtpFromEmail() != null && !config.getSmtpFromEmail().isEmpty()) ? config.getSmtpFromEmail() : defaultFrom;

        if (host == null || host.isEmpty()) {
            log.warn("SMTP Host is not configured. Email to {} could not be sent.", to);
            return;
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(user);
        mailSender.setPassword(pass);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        
        // Handle SSL/TLS specifically for port 465 (common for Zoho)
        if (port == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String fromAddress = from;
            String fromName = config.getSmtpFromName();
            
            if (fromName != null && !fromName.isEmpty()) {
                helper.setFrom(fromAddress, fromName);
            } else {
                helper.setFrom(fromAddress);
            }

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully via SMTP to {}", to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
        }
    }
}
