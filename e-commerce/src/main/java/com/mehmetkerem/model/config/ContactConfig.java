package com.mehmetkerem.model.config;

import jakarta.persistence.Column;
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
public class ContactConfig {

    private String phone = "+90 (212) 555-0123";

    private String email = "info@canantika.com";

    private String website = "www.canantika.com";

    @Column(length = 500)
    private String address = "Çukurcuma Caddesi No: 45, Beyoğlu, İstanbul";

    private String whatsapp = "+90 (212) 555-0123";

    private String weekdayHours = "10:00 - 18:00";

    private String saturdayHours = "11:00 - 17:00";
}
