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
public class NotificationConfig {

    // SMTP
    private String smtpHost = "smtp.zoho.eu";

    private Integer smtpPort = 465;

    private String smtpUsername = "";

    private String smtpPassword = "";

    private String smtpFromEmail = "";

    private String smtpFromName = "Can Antika";

    // SMS
    private String smsProvider = "";

    private String smsApiKey = "";

    private String smsApiSecret = "";

    private String smsSenderName = "";

    private Boolean smsEnabled = false;
}
