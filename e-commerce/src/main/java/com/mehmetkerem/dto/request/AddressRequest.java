package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AddressRequest {

    @NotNull(message = "Adres başlığı boş olamaz.")
    private String title;

    @NotNull(message = "Ülke bilgisi boş olamaz.")
    private String country;

    @NotNull(message = "Şehir bilgisi boş olamaz.")
    private String city;

    @NotNull(message = "İlçe bilgisi boş olamaz.")
    private String district;

    @NotNull(message = "Mahalle bilgisi boş olamaz.")
    private String neighborhood;

    @NotNull(message = "Telefon numarası boş olamaz.")
    @Pattern(regexp = "^(?:(?:\\+?90|0)[\\s-]?)?(?:\\(?[2345]\\d{2}\\)?)[\\s-]?\\d{3}[\\s-]?\\d{2}[\\s-]?\\d{2}$", message = "Telefon numarası geçersiz.")
    private String phone;

    @NotNull(message = "Posta kodu boş olamaz.")
    private String postalCode;

    @NotNull(message = "Adres satırı boş olamaz.")
    private String addressLine;
}
