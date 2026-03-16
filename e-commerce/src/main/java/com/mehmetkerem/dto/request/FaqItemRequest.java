package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqItemRequest {
    @NotBlank(message = "Soru zorunludur")
    private String question;

    @NotBlank(message = "Cevap zorunludur")
    private String answer;

    @Min(value = 0, message = "Sıralama 0 veya daha büyük olmalıdır")
    private int displayOrder;

    private boolean active;
}
