package com.mehmetkerem.dto.response;

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
public class CouponResponse {
    private Long id;
    private String code;
    private BigDecimal discountAmount;
    private String discountType;
    private BigDecimal minCartAmount;
    private LocalDateTime expirationDate;
    private int maxUsageCount;
    private int currentUsageCount;
    private int perUserLimit;
    private String description;
    private boolean active;
}
