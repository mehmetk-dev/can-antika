package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.StatsResponse;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.enums.Role;
import com.mehmetkerem.event.OrderEventListener;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements com.mehmetkerem.service.IStatsService {

        private final OrderRepository orderRepository;
        private final ProductRepository productRepository;
        private final UserRepository userRepository;

        @Value("${app.stats.daily-range-days:7}")
        private int dailyRangeDays;

        @Value("${app.stock.alert-threshold:5}")
        private int stockAlertThreshold;

        private static final int TOP_LIMIT = 5;

        @Override
        public StatsResponse getAdminStats() {
                return getAdminStats(dailyRangeDays);
        }

        @Override
        public StatsResponse getAdminStats(int days) {
                BigDecimal revenue = orderRepository.calculateTotalRevenue();

                LocalDateTime rangeStart = LocalDateTime.now().minusDays(days);
                List<Object[]> rawStats = orderRepository.getDailyStats(rangeStart);

                List<StatsResponse.DailyStats> dailyStats = rawStats.stream()
                                .map(row -> StatsResponse.DailyStats.builder()
                                                .date((String) row[0])
                                                .revenue(row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO)
                                                .orderCount(((Number) row[2]).longValue())
                                                .build())
                                .toList();

                // Müşteri istatistikleri
                long totalCustomers = userRepository.countByRole(Role.USER);
                LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                long newCustomersThisMonth = userRepository.countByRoleAndCreatedAtAfter(Role.USER, monthStart);

                // Sipariş durumları
                long pendingOrders = orderRepository.countByOrderStatus(OrderStatus.PENDING);
                long totalOrders = orderRepository.countTotalOrders();
                long totalProducts = productRepository.count();
                long activeProducts = totalProducts; // soft delete zaten filtreler

                // Top ürünler
                List<StatsResponse.TopProduct> topProducts = buildTopProducts();

                // Top müşteriler
                List<StatsResponse.TopCustomer> topCustomers = buildTopCustomers();

                // Sipariş durum dağılımı
                List<StatsResponse.OrderStatusBreakdown> statusBreakdown = buildOrderStatusBreakdown();

                // Aylık trendler (son 12 ay)
                List<StatsResponse.MonthlyTrend> monthlyTrends = buildMonthlyTrends();

                return StatsResponse.builder()
                                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                                .totalOrders(totalOrders)
                                .lowStockProducts(productRepository.countByStockLessThan(stockAlertThreshold))
                                .totalProducts(totalProducts)
                                .totalCustomers(totalCustomers)
                                .newCustomersThisMonth(newCustomersThisMonth)
                                .pendingOrders(pendingOrders)
                                .activeProducts(activeProducts)
                                .dailyStats(dailyStats)
                                .topProducts(topProducts)
                                .topCustomers(topCustomers)
                                .orderStatusBreakdown(statusBreakdown)
                                .monthlyTrends(monthlyTrends)
                                .build();
        }

        private List<StatsResponse.TopProduct> buildTopProducts() {
                try {
                        return orderRepository.getTopSellingProducts(TOP_LIMIT).stream()
                                        .map(row -> StatsResponse.TopProduct.builder()
                                                        .id(((Number) row[0]).longValue())
                                                        .title((String) row[1])
                                                        .totalSold(((Number) row[2]).longValue())
                                                        .totalRevenue(row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO)
                                                        .build())
                                        .toList();
                } catch (Exception e) {
                        return Collections.emptyList();
                }
        }

        private List<StatsResponse.TopCustomer> buildTopCustomers() {
                try {
                        return orderRepository.getTopCustomers(TOP_LIMIT).stream()
                                        .map(row -> StatsResponse.TopCustomer.builder()
                                                        .id(((Number) row[0]).longValue())
                                                        .name((String) row[1])
                                                        .email((String) row[2])
                                                        .totalOrders(((Number) row[3]).longValue())
                                                        .totalSpent(row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO)
                                                        .build())
                                        .toList();
                } catch (Exception e) {
                        return Collections.emptyList();
                }
        }

        private List<StatsResponse.OrderStatusBreakdown> buildOrderStatusBreakdown() {
                try {
                        List<StatsResponse.OrderStatusBreakdown> breakdown = new java.util.ArrayList<>();
                        for (OrderStatus status : OrderStatus.values()) {
                                String label = OrderEventListener.resolveStatusLabel(status);
                                // count fonksiyonu JPA'dan
                                long count = orderRepository.count(
                                                (root, query, cb) -> cb.equal(root.get("orderStatus"), status));
                                breakdown.add(StatsResponse.OrderStatusBreakdown.builder()
                                                .status(status.name())
                                                .label(label)
                                                .count(count)
                                                .build());
                        }
                        return breakdown;
                } catch (Exception e) {
                        return Collections.emptyList();
                }
        }

        private List<StatsResponse.MonthlyTrend> buildMonthlyTrends() {
                try {
                        LocalDateTime yearAgo = LocalDateTime.now().minusMonths(12);
                        return orderRepository.getMonthlyRevenue(yearAgo).stream()
                                        .map(row -> StatsResponse.MonthlyTrend.builder()
                                                        .month((String) row[0])
                                                        .revenue(row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO)
                                                        .orderCount(((Number) row[2]).longValue())
                                                        .build())
                                        .toList();
                } catch (Exception e) {
                        return Collections.emptyList();
                }
        }
}

