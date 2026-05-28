package com.mehmetkerem.service.payment;

import com.mehmetkerem.config.PaytrProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PaytrHashServiceTest {

    @Test
    void createIframeTokenHash_ShouldUseOfficialPaytrConcatenation() {
        PaytrProperties properties = new PaytrProperties();
        properties.setMerchantKey("merchant-key");
        properties.setMerchantSalt("merchant-salt");

        PaytrHashService service = new PaytrHashService(properties);

        String hash = service.createIframeTokenHash(
                "123456",
                "203.0.113.10",
                "CA10P99",
                "buyer@example.com",
                "19999",
                "W1siVGVzdCBQcm9kdWN0IiwiMTk5Ljk5IiwxXV0=",
                "0",
                "0",
                "TL",
                "1");

        assertEquals("7xEQv/gF2b1SlK/Youwwe43QkZqyuzBJG1ZHxcvch0Q=", hash);
    }

    @Test
    void isValidCallbackHash_ShouldRejectChangedStatus() {
        PaytrProperties properties = new PaytrProperties();
        properties.setMerchantKey("merchant-key");
        properties.setMerchantSalt("merchant-salt");

        PaytrHashService service = new PaytrHashService(properties);
        String validHash = service.createCallbackHash("CA10P99", "success", "19999");

        assertTrue(service.isValidCallbackHash("CA10P99", "success", "19999", validHash));
        assertFalse(service.isValidCallbackHash("CA10P99", "failed", "19999", validHash));
    }
}
