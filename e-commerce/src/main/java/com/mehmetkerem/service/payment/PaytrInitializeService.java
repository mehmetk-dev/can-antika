package com.mehmetkerem.service.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mehmetkerem.config.PaytrProperties;
import com.mehmetkerem.dto.response.PaytrInitializeResponse;
import com.mehmetkerem.enums.PaymentMethod;
import com.mehmetkerem.enums.PaymentStatus;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.OrderItem;
import com.mehmetkerem.model.Payment;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.PaymentRepository;
import com.mehmetkerem.repository.UserRepository;
import com.mehmetkerem.service.IOrderAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaytrInitializeService {

    private final PaytrProperties properties;
    private final PaytrHashService hashService;
    private final PaytrTokenClient tokenClient;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final IOrderAuthorizationService orderAuthorizationService;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    @Transactional
    public PaytrInitializeResponse initialize(Long userId, Long orderId, String userIp) {
        ensureConfigured();
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, orderId, "sipariş")));
        orderAuthorizationService.assertOwner(order, userId);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Bu sipariş için zaten ödeme yapılmış.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, userId, "kullanıcı")));

        String merchantOid = buildMerchantOid(orderId);
        String paymentAmount = toPaytrAmount(order.getTotalAmount());
        String userBasket = encodeBasket(order.getOrderItems());
        String token = hashService.createIframeTokenHash(
                properties.getMerchantId(),
                userIp,
                merchantOid,
                user.getEmail(),
                paymentAmount,
                userBasket,
                properties.getNoInstallment(),
                properties.getMaxInstallment(),
                properties.getCurrency(),
                properties.getTestMode());

        Map<String, String> form = buildTokenForm(order, user, userIp, merchantOid, paymentAmount, userBasket, token);
        Map<String, String> response = tokenClient.requestToken(properties.getTokenUrl(), form);
        if (!"success".equalsIgnoreCase(response.get("status")) || response.get("token") == null) {
            throw new BadRequestException(response.getOrDefault("reason", "PayTR ödeme formu başlatılamadı."));
        }

        Payment payment = Payment.builder()
                .userId(userId)
                .orderId(orderId)
                .amount(order.getTotalAmount())
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionId(merchantOid)
                .idempotencyKey("paytr-" + merchantOid)
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        String iframeToken = response.get("token");
        return PaytrInitializeResponse.builder()
                .orderId(orderId)
                .merchantOid(merchantOid)
                .iframeToken(iframeToken)
                .iframeUrl(properties.getIframeUrlTemplate().replace("{token}", iframeToken))
                .build();
    }

    private Map<String, String> buildTokenForm(
            Order order,
            User user,
            String userIp,
            String merchantOid,
            String paymentAmount,
            String userBasket,
            String token) {
        String okUrl = frontendUrl.replaceAll("/$", "") + "/hesap/siparisler/" + order.getId();
        String failUrl = frontendUrl.replaceAll("/$", "") + "/siparis?odeme=basarisiz&orderId=" + order.getId();
        String address = order.getShippingAddress() == null ? "" : order.getShippingAddress().getAddressLine();
        String phone = order.getShippingAddress() == null ? "" : order.getShippingAddress().getPhone();

        Map<String, String> form = new LinkedHashMap<>();
        form.put("merchant_id", properties.getMerchantId());
        form.put("email", user.getEmail());
        form.put("payment_amount", paymentAmount);
        form.put("merchant_oid", merchantOid);
        form.put("user_name", user.getName() == null ? user.getEmail() : user.getName());
        form.put("user_address", address);
        form.put("user_phone", phone);
        form.put("merchant_ok_url", okUrl);
        form.put("merchant_fail_url", failUrl);
        form.put("user_basket", userBasket);
        form.put("user_ip", userIp);
        form.put("timeout_limit", properties.getTimeoutLimit());
        form.put("debug_on", properties.getDebugOn());
        form.put("test_mode", properties.getTestMode());
        form.put("lang", properties.getLang());
        form.put("no_installment", properties.getNoInstallment());
        form.put("max_installment", properties.getMaxInstallment());
        form.put("currency", properties.getCurrency());
        form.put("paytr_token", token);
        return form;
    }

    private String encodeBasket(List<OrderItem> items) {
        try {
            List<List<Object>> basket = items.stream()
                    .map(item -> List.of(
                            (Object) (item.getTitle() == null ? "Ürün" : item.getTitle()),
                            item.getPrice().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                            item.getQuantity()))
                    .toList();
            String json = objectMapper.writeValueAsString(basket);
            return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("PayTR sepet verisi oluşturulamadı.", e);
        }
    }

    private String toPaytrAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private String buildMerchantOid(Long orderId) {
        return "CA" + orderId + "P" + System.currentTimeMillis();
    }

    private void ensureConfigured() {
        if (properties.getMerchantId().isBlank()
                || properties.getMerchantKey().isBlank()
                || properties.getMerchantSalt().isBlank()) {
            throw new BadRequestException("PayTR yapılandırması eksik.");
        }
    }
}
