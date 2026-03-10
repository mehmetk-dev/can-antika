package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.CartItemRequest;
import com.mehmetkerem.dto.response.CartResponse;
import com.mehmetkerem.util.ResultData;

import java.math.BigDecimal;
import java.util.List;

public interface IRestCartController {
    ResultData<CartResponse> getCart();

    ResultData<CartResponse> addItem(CartItemRequest request);

    ResultData<CartResponse> syncCart(List<CartItemRequest> requests);

    ResultData<CartResponse> updateQuantity(Long productId, int quantity);

    ResultData<CartResponse> removeItem(Long productId);

    ResultData<String> clearCart();

    ResultData<BigDecimal> getTotal();

    ResultData<CartResponse> applyCoupon(String code);

    ResultData<CartResponse> removeCoupon();
}
