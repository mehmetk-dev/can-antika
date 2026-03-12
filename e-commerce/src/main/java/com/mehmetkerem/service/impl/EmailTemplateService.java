package com.mehmetkerem.service.impl;

import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.model.config.ContactConfig;
import com.mehmetkerem.model.config.StoreConfig;
import com.mehmetkerem.service.IEmailTemplateService;
import com.mehmetkerem.service.ISiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailTemplateService implements IEmailTemplateService {

    private final TemplateEngine templateEngine;
    private final ISiteSettingsService siteSettingsService;

    @Override
    public String renderOrderConfirmation(String orderCode) {
        return render("Siparişiniz Alındı!", "email/order-confirmation",
                Map.of("orderCode", orderCode));
    }

    @Override
    public String renderWelcome(String name) {
        return render("Hoş Geldiniz!", "email/welcome",
                Map.of("name", name));
    }

    @Override
    public String renderPasswordReset(String resetUrl) {
        return render("Şifre Sıfırlama", "email/password-reset",
                Map.of("resetUrl", resetUrl));
    }

    @Override
    public String renderOrderTracking(String orderCode, String trackingNumber, String carrier) {
        return render("Siparişiniz Yola Çıktı!", "email/order-tracking",
                Map.of("orderCode", orderCode, "trackingNumber", trackingNumber, "carrier", carrier));
    }

    @Override
    public String renderStockAlert(String productName, int currentStock) {
        return render("Stok Uyarısı", "email/stock-alert",
                Map.of("productName", productName, "currentStock", currentStock));
    }

    @Override
    public String renderOrderStatusUpdate(String orderCode, String statusLabel) {
        return render("Sipariş Durumu Güncellendi", "email/order-status-update",
                Map.of("orderCode", orderCode, "statusLabel", statusLabel));
    }

    private String render(String title, String contentTemplate, Map<String, Object> variables) {
        SiteSettings settings = siteSettingsService.get();
        StoreConfig store = settings.getStoreConfig();
        ContactConfig contact = settings.getContactConfig();

        Context ctx = new Context();
        ctx.setVariable("title", title);
        ctx.setVariable("contentTemplate", contentTemplate);
        ctx.setVariable("storeName", store.getStoreName());
        ctx.setVariable("address", contact.getAddress());
        ctx.setVariable("phone", contact.getPhone());
        ctx.setVariable("contactEmail", contact.getEmail());
        variables.forEach(ctx::setVariable);

        return templateEngine.process("email/layout", ctx);
    }
}
