package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactRequestDto {

    @NotBlank(message = "İsim boş bırakılamaz")
    @Size(max = 100, message = "İsim en fazla 100 karakter olabilir")
    private String name;

    @NotBlank(message = "E-posta boş bırakılamaz")
    @Email(message = "Geçerli bir e-posta adresi giriniz")
    private String email;

    private String phone;

    @NotBlank(message = "Konu boş bırakılamaz")
    @Size(max = 200, message = "Konu en fazla 200 karakter olabilir")
    private String subject;

    @NotBlank(message = "Mesaj boş bırakılamaz")
    @Size(max = 2000, message = "Mesaj en fazla 2000 karakter olabilir")
    private String message;
}
