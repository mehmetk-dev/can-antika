package com.mehmetkerem.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Builder
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItemResponse {

    private Long id;

    private ProductResponse product;

    private Long productId;

    private String productSlug;

    private String title;

    private List<String> imageUrls;

    private Integer quantity;

    private BigDecimal price;
}
