// mapper/OrderMapper.java
package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.request.OrderRequest;
import com.mehmetkerem.dto.response.OrderItemResponse;
import com.mehmetkerem.dto.response.OrderResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.CartItem;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.OrderItem;
import org.mapstruct.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = { OrderItemMapper.class,
        AddressMapper.class }, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "orderItems", ignore = true)
    @Mapping(target = "shippingAddress", ignore = true)
    Order toEntity(OrderRequest request);

    @Mapping(target = "user", ignore = true)
    OrderResponse toResponse(Order entity);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "orderItems", ignore = true)
    @Mapping(target = "shippingAddress", ignore = true)
    void update(@MappingTarget Order entity, OrderRequest request);

    default OrderResponse toResponseWithUser(Order entity, UserResponse user) {
        OrderResponse resp = toResponse(entity);
        resp.setUser(user);
        return resp;
    }

    /**
     * CartItem listesini OrderItem listesine dönüştürür.
     * Product bilgileri productMap üzerinden zenginleştirilir.
     */
    default List<OrderItem> cartItemsToOrderItems(List<CartItem> cartItems, Map<Long, ProductResponse> productMap) {
        return cartItems.stream()
                .map(ci -> {
                    ProductResponse product = productMap.get(ci.getProductId());
                    if (product == null) {
                        throw new NotFoundException("Ürün bulunamadı. ID: " + ci.getProductId());
                    }
                    return OrderItem.builder()
                            .productId(ci.getProductId())
                            .title(product.getTitle())
                            .price(product.getPrice())
                            .quantity(ci.getQuantity())
                            .build();
                })
                .toList();
    }

    /**
     * OrderItem listesini OrderItemResponse listesine dönüştürür.
     * Eğer productMap verilmişse ürün bilgileri (resim, slug vb.) zenginleştirilir.
     */
    default List<OrderItemResponse> orderItemsToResponses(List<OrderItem> orderItems) {
        return orderItemsToResponses(orderItems, Map.of());
    }

    default List<OrderItemResponse> orderItemsToResponses(List<OrderItem> orderItems, Map<Long, ProductResponse> productMap) {
        return orderItems.stream()
                .map(orderItem -> {
                    ProductResponse fullProduct = productMap.get(orderItem.getProductId());
                    ProductResponse product = fullProduct != null
                            ? fullProduct
                            : new ProductResponse(orderItem.getProductId(), orderItem.getTitle(), orderItem.getPrice());
                    return OrderItemResponse.builder()
                            .product(product)
                            .quantity(orderItem.getQuantity())
                            .price(orderItem.getPrice())
                            .build();
                })
                .toList();
    }
}
