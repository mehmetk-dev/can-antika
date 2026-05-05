package com.mehmetkerem.service.order;

import com.mehmetkerem.model.config.ShippingConfig;

import java.math.BigDecimal;

public final class ShippingFeeCalculator {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private ShippingFeeCalculator() {
    }

    public static BigDecimal calculate(BigDecimal payableSubtotal, ShippingConfig config) {
        if (payableSubtotal == null || payableSubtotal.compareTo(ZERO) <= 0) {
            return ZERO;
        }

        int freeShippingMin = config != null && config.getFreeShippingMin() != null
                ? config.getFreeShippingMin()
                : 0;
        if (freeShippingMin > 0 && payableSubtotal.compareTo(BigDecimal.valueOf(freeShippingMin)) >= 0) {
            return ZERO;
        }

        int shippingFee = config != null && config.getExpressShippingFee() != null
                ? config.getExpressShippingFee()
                : 0;
        return BigDecimal.valueOf(Math.max(shippingFee, 0));
    }
}
