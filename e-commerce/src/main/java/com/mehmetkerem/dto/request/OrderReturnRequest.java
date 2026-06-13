package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OrderReturnRequest {

    @NotNull(message = "Sipariş ID boş olamaz.")
    @Positive(message = "Sipariş ID pozitif olmalıdır.")
    private Long orderId;

    @NotBlank(message = "İade sebebi boş olamaz.")
    @Size(max = 2000, message = "İade sebebi 2000 karakteri geçemez.")
    private String reason;
}
