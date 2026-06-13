package com.mehmetkerem.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartRequest {

    @NotEmpty(message = "Sepet en az bir ürün içermelidir.")
    @Size(max = 100, message = "Sepet en fazla 100 ürün içerebilir.")
    private List<@Valid CartItemRequest> items;

    private LocalDateTime updatedAt;
}
