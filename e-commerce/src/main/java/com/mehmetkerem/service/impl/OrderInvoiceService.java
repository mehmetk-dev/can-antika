package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.OrderInvoiceResponse;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.service.IOrderInvoiceService;
import com.mehmetkerem.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Sipariş fatura/fiş bilgisi oluşturma servisi.
 */
@Service
@RequiredArgsConstructor
public class OrderInvoiceService implements IOrderInvoiceService {

    private final IUserService userService;

    @Override
    public OrderInvoiceResponse buildInvoice(Order order) {
        UserResponse user = userService.getUserResponseById(order.getUserId());
        String addressSummary = order.getShippingAddress() != null
                ? String.join(", ", order.getShippingAddress().getAddressLine(),
                        order.getShippingAddress().getDistrict(), order.getShippingAddress().getCity(),
                        order.getShippingAddress().getCountry())
                : "";

        List<OrderInvoiceResponse.InvoiceItemLine> lines = order.getOrderItems().stream()
                .map(item -> OrderInvoiceResponse.InvoiceItemLine.builder()
                        .productTitle(item.getTitle())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getPrice())
                        .lineTotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build())
                .toList();

        return OrderInvoiceResponse.builder()
                .invoiceNumber("INV-" + order.getId())
                .orderId(order.getId())
                .orderDate(order.getOrderDate())
                .customerName(user.getName())
                .shippingAddressSummary(addressSummary)
                .items(lines)
                .subtotal(order.getTotalAmount())
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus().name())
                .build();
    }
}
