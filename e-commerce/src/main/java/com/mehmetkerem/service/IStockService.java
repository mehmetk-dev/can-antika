package com.mehmetkerem.service;

import com.mehmetkerem.dto.request.CartItemRequest;
import com.mehmetkerem.event.OrderEvent;
import com.mehmetkerem.model.OrderItem;
import com.mehmetkerem.model.Product;

import java.util.List;

public interface IStockService {

    /**
     * Sipariş kalemleri için stok yeterliliğini kontrol eder ve stokları düşürür.
     * Düşük stok uyarılarını döner.
     */
    List<OrderEvent.StockAlertInfo> validateAndDeductStock(List<OrderItem> orderItems);

    /**
     * İptal veya iade durumunda stokları geri yükler.
     */
    void revertStockLevels(List<OrderItem> orderItems);

    /**
     * Sepet kalemleri için toplu stok yeterliliği kontrolü (stok düşürmez).
     */
    void validateCartStock(List<CartItemRequest> requests);

    /**
     * Tekil ürün için stok yeterliliği kontrolü (stok düşürmez).
     */
    void validateCartItemStock(int quantity, Product product);
}
