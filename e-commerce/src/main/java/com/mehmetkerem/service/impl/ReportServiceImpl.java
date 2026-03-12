package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.AbandonedCartResponse;
import com.mehmetkerem.dto.response.ReportResponse;
import com.mehmetkerem.model.Cart;
import com.mehmetkerem.model.Category;
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
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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
        try {
            return orderRepository.getSalesByCategory().stream()
                    .map(row -> ReportResponse.SalesByCategoryReport.builder()
                            .categoryId(((Number) row[0]).longValue())
                            .categoryName((String) row[1])
                            .totalSold(((Number) row[2]).longValue())
                            .totalRevenue(row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO)
                            .build())
                    .toList();
        } catch (Exception e) {
            log.warn("Kategori bazlı satış raporu oluşturulurken hata: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<ReportResponse.StockReportItem> stockReport(int threshold) {
        List<Product> products = productRepository.findByStockLessThanEqualOrderByStockAsc(threshold);

        // Batch fetch categories
        Set<Long> categoryIds = products.stream()
                .map(Product::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> categoryNames = categoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));

        return products.stream()
                .map(product -> ReportResponse.StockReportItem.builder()
                        .productId(product.getId())
                        .productTitle(product.getTitle())
                        .imageUrl(product.getImageUrls() != null && !product.getImageUrls().isEmpty()
                                ? product.getImageUrls().get(0) : null)
                        .stock(product.getStock())
                        .price(product.getPrice())
                        .categoryName(product.getCategoryId() != null
                                ? categoryNames.getOrDefault(product.getCategoryId(), "")
                                : "")
                        .build())
                .toList();
    }

    @Override
    public List<ReportResponse.CustomerReportItem> customerReport() {
        List<Object[]> rawTopCustomers = orderRepository.getTopCustomers(20);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        return rawTopCustomers.stream()
                .map(row -> {
                    String registeredAt = "";
                    if (row[5] != null) {
                        try {
                            LocalDateTime createdAt = row[5] instanceof Timestamp ts
                                    ? ts.toLocalDateTime()
                                    : (LocalDateTime) row[5];
                            registeredAt = createdAt.format(fmt);
                        } catch (Exception e) {
                            log.warn("Müşteri kayıt tarihi çözümlenemedi: userId={}", row[0]);
                        }
                    }
                    return ReportResponse.CustomerReportItem.builder()
                            .userId(((Number) row[0]).longValue())
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
        LocalDateTime cutoff = LocalDateTime.now().minusHours(hoursThreshold);
        Page<Cart> carts = cartRepository.findAbandonedCarts(cutoff, PageRequest.of(page, size));

        // Batch fetch users and products for all carts in the page
        Set<Long> userIds = carts.stream().map(Cart::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Set<Long> productIds = carts.stream()
                .filter(c -> c.getItems() != null)
                .flatMap(c -> c.getItems().stream())
                .map(item -> item.getProductId())
                .collect(Collectors.toSet());
        Map<Long, Product> productMap = productRepository.findByIdIn(new ArrayList<>(productIds)).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        return carts.map(cart -> {
            User user = userMap.get(cart.getUserId());

            BigDecimal total = BigDecimal.ZERO;
            List<AbandonedCartResponse.Item> items = new ArrayList<>();
            if (cart.getItems() != null) {
                for (var cartItem : cart.getItems()) {
                    BigDecimal itemTotal = cartItem.getPrice() != null
                            ? cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                            : BigDecimal.ZERO;
                    total = total.add(itemTotal);

                    Product product = productMap.get(cartItem.getProductId());
                    items.add(AbandonedCartResponse.Item.builder()
                            .productId(cartItem.getProductId())
                            .productTitle(product != null ? product.getTitle() : "")
                            .productImage(product != null && product.getImageUrls() != null
                                    && !product.getImageUrls().isEmpty()
                                    ? product.getImageUrls().get(0) : null)
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
