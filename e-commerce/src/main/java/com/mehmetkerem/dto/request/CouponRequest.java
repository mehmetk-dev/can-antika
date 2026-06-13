package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {
    @NotBlank(message = "Kupon kodu zorunludur.")
    @Size(max = 50, message = "Kupon kodu 50 karakteri geçemez.")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Kupon kodu geçersiz karakter içeriyor.")
    private String code;
    @NotNull(message = "İndirim tutarı zorunludur.")
    @DecimalMin(value = "0.01", message = "İndirim tutarı sıfırdan büyük olmalıdır.")
    private BigDecimal discountAmount;
    @NotBlank(message = "İndirim tipi zorunludur.")
    @Pattern(regexp = "FIXED|PERCENTAGE", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "İndirim tipi FIXED veya PERCENTAGE olmalıdır.")
    private String discountType;
    @DecimalMin(value = "0.0", message = "Minimum sepet tutarı negatif olamaz.")
    private BigDecimal minCartAmount;
    @NotNull(message = "Son kullanma tarihi zorunludur.")
    @Future(message = "Son kullanma tarihi gelecekte olmalıdır.")
    private LocalDateTime expirationDate;
    @PositiveOrZero(message = "Maksimum kullanım sayısı negatif olamaz.")
    private int maxUsageCount;
    @PositiveOrZero(message = "Kullanıcı limiti negatif olamaz.")
    private int perUserLimit;
    @Size(max = 500, message = "Açıklama 500 karakteri geçemez.")
    private String description;
    private boolean active;
}
