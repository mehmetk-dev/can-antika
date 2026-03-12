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
public class ShippingConfig {

    private String standardDelivery = "3-5 iş günü";

    private String expressDelivery = "1-2 iş günü";

    private Integer freeShippingMin = 500;

    private Integer shippingDurationDays = 5;

    private Integer expressShippingFee = 50;
}
