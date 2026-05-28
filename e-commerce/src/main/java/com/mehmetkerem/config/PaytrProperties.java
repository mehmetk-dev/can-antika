package com.mehmetkerem.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "paytr")
public class PaytrProperties {

    private String merchantId = "";
    private String merchantKey = "";
    private String merchantSalt = "";
    private String tokenUrl = "https://www.paytr.com/odeme/api/get-token";
    private String iframeUrlTemplate = "https://www.paytr.com/odeme/guvenli/{token}";
    private String currency = "TL";
    private String testMode = "1";
    private String debugOn = "1";
    private String noInstallment = "0";
    private String maxInstallment = "0";
    private String timeoutLimit = "30";
    private String lang = "tr";
}
