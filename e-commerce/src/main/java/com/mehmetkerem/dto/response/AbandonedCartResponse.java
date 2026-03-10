package com.mehmetkerem.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AbandonedCartResponse {
    private Long cartId;
    private Long userId;
    private String userName;
    private String userEmail;
    private BigDecimal cartTotal;
    private int itemCount;
    private LocalDateTime lastActivity;
    private List<Item> items;

    @Data
    @Builder
    public static class Item {
        private Long productId;
        private String productTitle;
        private String productImage;
        private int quantity;
        private BigDecimal price;
    }
}
