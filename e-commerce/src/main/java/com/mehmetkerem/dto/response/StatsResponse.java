package com.mehmetkerem.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class StatsResponse {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long lowStockProducts;
    private long totalProducts;
    private long totalCustomers;
    private long newCustomersThisMonth;
    private long pendingOrders;
    private long activeProducts;
    private List<DailyStats> dailyStats;
    private List<TopProduct> topProducts;
    private List<TopCustomer> topCustomers;
    private List<OrderStatusBreakdown> orderStatusBreakdown;
    private List<MonthlyTrend> monthlyTrends;
    private List<RecentActivity> recentActivities;

    @Data
    @Builder
    public static class DailyStats {
        private String date;
        private BigDecimal revenue;
        private long orderCount;
    }

    @Data
    @Builder
    public static class TopProduct {
        private Long id;
        private String title;
        private String imageUrl;
        private long totalSold;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    public static class TopCustomer {
        private Long id;
        private String name;
        private String email;
        private long totalOrders;
        private BigDecimal totalSpent;
    }

    @Data
    @Builder
    public static class OrderStatusBreakdown {
        private String status;
        private String label;
        private long count;
    }

    @Data
    @Builder
    public static class MonthlyTrend {
        private String month;
        private BigDecimal revenue;
        private long orderCount;
    }

    @Data
    @Builder
    public static class RecentActivity {
        private String type;
        private String description;
        private String timestamp;
    }
}
