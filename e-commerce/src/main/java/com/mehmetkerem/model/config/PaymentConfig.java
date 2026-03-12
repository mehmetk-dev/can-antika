package com.mehmetkerem.model.config;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentConfig {

    private String currency = "TRY";

    private String currencySymbol = "₺";

    private String paymentProvider = "";

    private String paymentApiKey = "";

    private String paymentSecretKey = "";

    private String paymentMerchantId = "";

    private Boolean paymentTestMode = true;

    private Boolean creditCardEnabled = true;

    private Boolean bankTransferEnabled = true;

    private Boolean cashOnDeliveryEnabled = false;
}
