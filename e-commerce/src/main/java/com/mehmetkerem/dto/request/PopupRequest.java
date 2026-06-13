package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopupRequest {
    @NotBlank(message = "Başlık zorunludur.")
    @Size(max = 150, message = "Başlık 150 karakteri geçemez.")
    private String title;
    @Size(max = 5000, message = "İçerik 5000 karakteri geçemez.")
    private String content;
    @Size(max = 2048, message = "Görsel URL'si 2048 karakteri geçemez.")
    private String imageUrl;
    @Size(max = 2048, message = "Bağlantı URL'si 2048 karakteri geçemez.")
    private String linkUrl;
    @Size(max = 100, message = "Bağlantı metni 100 karakteri geçemez.")
    private String linkText;
    private boolean active;
    @Pattern(regexp = "CENTER|BOTTOM|TOP", message = "Popup konumu CENTER, BOTTOM veya TOP olmalıdır.")
    private String position;
    @Min(value = 0, message = "Gecikme negatif olamaz.")
    @Max(value = 300, message = "Gecikme 300 saniyeyi geçemez.")
    private int delaySeconds;
    private boolean showOnce;
}
