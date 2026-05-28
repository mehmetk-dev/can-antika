package com.mehmetkerem.service.payment;

import com.mehmetkerem.config.PaytrProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PaytrHashService {

    private final PaytrProperties properties;

    public String createIframeTokenHash(
            String merchantId,
            String userIp,
            String merchantOid,
            String email,
            String paymentAmount,
            String userBasket,
            String noInstallment,
            String maxInstallment,
            String currency,
            String testMode) {
        String payload = merchantId
                + userIp
                + merchantOid
                + email
                + paymentAmount
                + userBasket
                + noInstallment
                + maxInstallment
                + currency
                + testMode
                + properties.getMerchantSalt();
        return hmacSha256Base64(payload);
    }

    public String createCallbackHash(String merchantOid, String status, String totalAmount) {
        return hmacSha256Base64(merchantOid + properties.getMerchantSalt() + status + totalAmount);
    }

    public boolean isValidCallbackHash(String merchantOid, String status, String totalAmount, String hash) {
        if (hash == null || hash.isBlank()) {
            return false;
        }
        byte[] expected = createCallbackHash(merchantOid, status, totalAmount).getBytes(StandardCharsets.UTF_8);
        byte[] actual = hash.getBytes(StandardCharsets.UTF_8);
        return expected.length == actual.length && MessageDigest.isEqual(expected, actual);
    }

    private String hmacSha256Base64(String payload) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    properties.getMerchantKey().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256");
            sha256Hmac.init(secretKey);
            return Base64.getEncoder().encodeToString(sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("PayTR hash üretilemedi.", e);
        }
    }
}
