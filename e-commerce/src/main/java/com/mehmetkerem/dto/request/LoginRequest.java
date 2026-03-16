package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @Email(message = "Geçerli bir e-posta adresi giriniz.")
    @NotBlank(message = "E-posta boş olamaz.")
    private String email;

    @NotBlank(message = "Şifre boş olamaz.")
    private String password;
}
