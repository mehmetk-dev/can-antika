package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NewsletterSubscriptionRequest {

    @NotBlank(message = "E-posta adresi zorunludur.")
    @Email(message = "Geçerli bir e-posta adresi giriniz.")
    @Size(max = 254, message = "E-posta adresi 254 karakteri geçemez.")
    private String email;

    @Size(max = 100, message = "İsim 100 karakteri geçemez.")
    private String name;
}
