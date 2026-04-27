package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderReturnRequest {

    @NotNull(message = "Sipariş ID boş olamaz.")
    private Long orderId;

    @NotBlank(message = "İade sebebi boş olamaz.")
    private String reason;
}
