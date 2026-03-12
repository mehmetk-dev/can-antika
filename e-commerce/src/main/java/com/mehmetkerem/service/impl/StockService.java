package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CartItemRequest;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.event.OrderEvent;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.OrderItem;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.IStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Stok kontrol, düşürme ve iade mantığını merkezi olarak yönetir.
 * OrderServiceImpl ve CartServiceImpl tarafından kullanılabilir.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StockService implements IStockService {

    private final IProductService productService;

    @Value("${app.stock.alert-threshold:5}")
    private int stockAlertThreshold;

    /**
     * Sipariş kalemleri için stok yeterliliğini kontrol eder ve stokları düşürür.
     * Düşük stok uyarılarını döner.
     */
    @Override
    public List<OrderEvent.StockAlertInfo> validateAndDeductStock(List<OrderItem> orderItems) {
        List<Long> productIds = orderItems.stream()
                .map(OrderItem::getProductId)
                .toList();

        List<Product> products = productService.getProductsByIds(productIds);

        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // 1. Önce TÜM ürünlerin stok yeterliliğini kontrol et
        for (OrderItem item : orderItems) {
            Product product = productMap.get(item.getProductId());
            if (product == null) {
                throw new NotFoundException("Ürün bulunamadı. ID: " + item.getProductId());
            }
            if (product.getStock() < item.getQuantity()) {
                throw new BadRequestException(
                        String.format(ExceptionMessages.INSUFFICIENT_STOCK, product.getTitle()));
            }
        }

        // 2. Kontrol geçtiyse stokları düşür ve düşük stok uyarılarını topla
        List<OrderEvent.StockAlertInfo> stockAlerts = new ArrayList<>();
        for (OrderItem item : orderItems) {
            Product product = productMap.get(item.getProductId());
            int newStock = product.getStock() - item.getQuantity();
            product.setStock(newStock);

            if (newStock <= stockAlertThreshold) {
                stockAlerts.add(OrderEvent.StockAlertInfo.builder()
                        .productTitle(product.getTitle())
                        .remainingStock(newStock)
                        .productId(product.getId())
                        .build());
            }
        }

        productService.saveAllProducts(products);
        return stockAlerts;
    }

    /**
     * İptal veya iade durumunda stokları geri yükler.
     */
    @Override
    public void revertStockLevels(List<OrderItem> orderItems) {
        List<Long> productIds = orderItems.stream()
                .map(OrderItem::getProductId)
                .toList();

        List<Product> products = productService.getProductsByIds(productIds);

        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        for (OrderItem item : orderItems) {
            Product product = productMap.get(item.getProductId());
            int newStock = product.getStock() + item.getQuantity();
            product.setStock(newStock);
            log.debug("Stok iade edildi. Ürün: {}, Yeni Stok: {}", product.getTitle(), newStock);
        }

        productService.saveAllProducts(products);
    }

    @Override
    public void validateCartStock(List<CartItemRequest> requests) {
        if (requests == null || requests.isEmpty()) return;

        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (CartItemRequest req : requests) {
            if (req == null || req.getProductId() == null) continue;
            Integer q = req.getQuantity();
            if (q == null || q <= 0) {
                Product p = productService.getProductById(req.getProductId());
                throw new BadRequestException(
                        String.format(ExceptionMessages.INSUFFICIENT_STOCK, p.getTitle()));
            }
            wanted.merge(req.getProductId(), q, Integer::sum);
        }

        if (wanted.isEmpty()) return;

        List<Long> ids = new ArrayList<>(wanted.keySet());
        List<ProductResponse> products = productService.getProductResponsesByIds(ids);

        Set<Long> foundIds = products.stream()
                .map(ProductResponse::getId)
                .collect(Collectors.toSet());
        List<Long> missing = ids.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();
        if (!missing.isEmpty()) {
            throw new NotFoundException("Products not found: " + missing);
        }

        Map<Long, ProductResponse> map = products.stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

        for (var entry : wanted.entrySet()) {
            ProductResponse p = map.get(entry.getKey());
            if (entry.getValue() > (p.getStock() == null ? 0 : p.getStock())) {
                throw new BadRequestException(
                        String.format(ExceptionMessages.INSUFFICIENT_STOCK, p.getTitle()));
            }
        }
    }

    @Override
    public void validateCartItemStock(int quantity, Product product) {
        if (quantity <= 0 || product.getStock() < quantity) {
            throw new BadRequestException(ExceptionMessages.UNKNOW_STOCK);
        }
    }
}
