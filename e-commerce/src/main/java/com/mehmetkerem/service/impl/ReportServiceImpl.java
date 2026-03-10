package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.AbandonedCartResponse;
import com.mehmetkerem.dto.response.ReportResponse;
import com.mehmetkerem.model.Cart;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.*;
import com.mehmetkerem.service.IReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@lombok.extern.slf4j.Slf4j
@RequiredArgsConstructor
public class ReportServiceImpl implements IReportService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<ReportResponse.SalesByCategoryReport> salesByCategory() {
        List<ReportResponse.SalesByCategoryReport> report = new ArrayList<>();
        try {
            var topProducts = orderRepository.getTopSellingProducts(10000);
            java.util.Map<Long, long[]> soldMap = new java.util.HashMap<>();
            java.util.Map<Long, BigDecimal> revenueMap = new java.util.HashMap<>();
            for (var row : topProducts) {
                Long pid = ((Number) row[0]).longValue();
                soldMap.put(pid, new long[]{((Number) row[2]).longValue()});
                revenueMap.put(pid, new BigDecimal(row[3].toString()));
            }

            var categories = categoryRepository.findAll();
            for (var cat : categories) {
                var products = productRepository.findByCategoryId(cat.getId());
                long totalSold = 0;
                BigDecimal totalRevenue = BigDecimal.ZERO;

                for (var product : products) {
                    if (soldMap.containsKey(product.getId())) {
                        totalSold += soldMap.get(product.getId())[0];
                        totalRevenue = totalRevenue.add(revenueMap.getOrDefault(product.getId(), BigDecimal.ZERO));
                    }
                }

                report.add(ReportResponse.SalesByCategoryReport.builder()
                        .categoryId(cat.getId())
                        .categoryName(cat.getName())
                        .totalSold(totalSold)
                        .totalRevenue(totalRevenue)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Kategori bazlı satış raporu oluşturulurken hata: {}", e.getMessage());
        }
        return report;
    }

    @Override
    public List<ReportResponse.StockReportItem> stockReport(int threshold) {
        List<ReportResponse.StockReportItem> items = new ArrayList<>();
        var products = productRepository.findAll();
        for (var product : products) {
            if (product.getStock() <= threshold) {
                String categoryName = "";
                try {
                    if (product.getCategoryId() != null) {
                        categoryName = categoryRepository.findById(product.getCategoryId())
                                .map(c -> c.getName()).orElse("");
                    }
                } catch (Exception e) {
                    log.warn("Kategori adı çözümlenemedi: productId={}", product.getId());
                }

                items.add(ReportResponse.StockReportItem.builder()
                        .productId(product.getId())
                        .productTitle(product.getTitle())
                        .imageUrl(product.getImageUrls() != null && !product.getImageUrls().isEmpty()
                                ? product.getImageUrls().get(0) : null)
                        .stock(product.getStock())
                        .price(product.getPrice())
                        .categoryName(categoryName)
                        .build());
            }
        }
        items.sort((a, b) -> Integer.compare(a.getStock(), b.getStock()));
        return items;
    }

    @Override
    public List<ReportResponse.CustomerReportItem> customerReport() {
        List<Object[]> rawTopCustomers = orderRepository.getTopCustomers(20);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        return rawTopCustomers.stream()
                .map(row -> {
                    Long userId = ((Number) row[0]).longValue();
                    String registeredAt = "";
                    try {
                        User user = userRepository.findById(userId).orElse(null);
                        if (user != null && user.getCreatedAt() != null) {
                            registeredAt = user.getCreatedAt().format(fmt);
                        }
                    } catch (Exception e) {
                        log.warn("Müşteri kayıt tarihi çözümlenemedi: userId={}", userId);
                    }

                    return ReportResponse.CustomerReportItem.builder()
                            .userId(userId)
                            .userName((String) row[1])
                            .userEmail((String) row[2])
                            .totalOrders(((Number) row[3]).longValue())
                            .totalSpent(row[4] != null ? new BigDecimal(row[4].toString()) : BigDecimal.ZERO)
                            .registeredAt(registeredAt)
                            .build();
                })
                .toList();
    }

    @Override
    public List<ReportResponse.RevenueByPeriod> revenueReport(int months) {
        LocalDateTime startDate = LocalDateTime.now().minusMonths(months);
        List<Object[]> rawMonthly = orderRepository.getMonthlyRevenue(startDate);
        return rawMonthly.stream()
                .map(row -> {
                    BigDecimal revenue = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                    long orderCount = ((Number) row[2]).longValue();
                    BigDecimal avg = orderCount > 0
                            ? revenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return ReportResponse.RevenueByPeriod.builder()
                            .period((String) row[0])
                            .revenue(revenue)
                            .orderCount(orderCount)
                            .avgOrderValue(avg)
                            .build();
                })
                .toList();
    }

    @Override
    public Page<AbandonedCartResponse> abandonedCarts(int page, int size, int hoursThreshold) {
        LocalDateTime threshold = LocalDateTime.now().minusHours(hoursThreshold);
        Page<Cart> carts = cartRepository.findAbandonedCarts(threshold, PageRequest.of(page, size));

        return carts.map(cart -> {
            User user = null;
            try {
                user = userRepository.findById(cart.getUserId()).orElse(null);
            } catch (Exception e) {
                log.warn("Terkedilmiş sepet kullanıcı bilgisi çözümlenemedi: userId={}", cart.getUserId());
            }

            BigDecimal total = BigDecimal.ZERO;
            List<AbandonedCartResponse.Item> items = new ArrayList<>();
            if (cart.getItems() != null) {
                for (var cartItem : cart.getItems()) {
                    BigDecimal itemTotal = cartItem.getPrice() != null
                            ? cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                            : BigDecimal.ZERO;
                    total = total.add(itemTotal);

                    String productTitle = "";
                    String productImage = null;
                    try {
                        Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
                        if (product != null) {
                            productTitle = product.getTitle();
                            if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
                                productImage = product.getImageUrls().get(0);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Ürün bilgisi çözümlenemedi: productId={}", cartItem.getProductId());
                    }

                    items.add(AbandonedCartResponse.Item.builder()
                            .productId(cartItem.getProductId())
                            .productTitle(productTitle)
                            .productImage(productImage)
                            .quantity(cartItem.getQuantity())
                            .price(cartItem.getPrice())
                            .build());
                }
            }

            return AbandonedCartResponse.builder()
                    .cartId(cart.getId())
                    .userId(cart.getUserId())
                    .userName(user != null ? user.getName() : "")
                    .userEmail(user != null ? user.getEmail() : "")
                    .cartTotal(total)
                    .itemCount(cart.getItems() != null ? cart.getItems().size() : 0)
                    .lastActivity(cart.getUpdatedAt())
                    .items(items)
                    .build();
        });
    }
}
