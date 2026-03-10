package com.mehmetkerem.service.payment.impl;

import com.mehmetkerem.service.payment.PaymentStrategy;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Test/dev amaçlı sahte ödeme stratejisi.
 * <p>
 * ÜRETİM ORTAMINDA KULLANILMAMALIDIR — gerçek bir ödeme gateway'i
 * (Iyzico, PayTR vb.) ile değiştirilmelidir. (AUDIT L5)
 */
@Service("mockPaymentStrategy")
@Slf4j
public class MockPaymentStrategy implements PaymentStrategy {

    @PostConstruct
    void warnIfActive() {
        log.warn("⚠️  MockPaymentStrategy aktif — üretim ortamında gerçek ödeme gateway'i kullanın!");
    }

    @Override
    public boolean pay(BigDecimal amount) {
        log.warn("Mock ödeme çağrıldı: {} TL — gerçek ödeme işlemi yapılmıyor!", amount);
        return true;
    }
}
