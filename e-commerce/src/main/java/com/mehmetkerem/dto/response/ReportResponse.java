package com.mehmetkerem.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReportResponse {

    @Data
    @Builder
    public static class SalesByCategoryReport {
        private Long categoryId;
        private String categoryName;
        private long totalSold;
        private BigDecimal totalRevenue;
        private long orderCount;
    }

    @Data
    @Builder
    public static class StockReportItem {
        private Long productId;
        private String productTitle;
        private String imageUrl;
        private int stock;
        private BigDecimal price;
        private String categoryName;
    }

    @Data
    @Builder
    public static class CustomerReportItem {
        private Long userId;
        private String userName;
        private String userEmail;
        private long totalOrders;
        private BigDecimal totalSpent;
        private String registeredAt;
        private String lastOrderAt;
    }

    @Data
    @Builder
    public static class RevenueByPeriod {
        private String period;
        private BigDecimal revenue;
        private long orderCount;
        private BigDecimal avgOrderValue;
    }
}
