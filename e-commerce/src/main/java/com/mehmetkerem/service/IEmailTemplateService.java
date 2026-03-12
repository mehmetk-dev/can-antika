package com.mehmetkerem.service;

public interface IEmailTemplateService {

    String renderOrderConfirmation(String orderCode);

    String renderWelcome(String name);

    String renderPasswordReset(String resetUrl);

    String renderOrderTracking(String orderCode, String trackingNumber, String carrier);

    String renderStockAlert(String productName, int currentStock);

    String renderOrderStatusUpdate(String orderCode, String statusLabel);
}
