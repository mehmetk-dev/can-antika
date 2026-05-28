package com.mehmetkerem.service.payment;

import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.enums.PaymentStatus;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.Payment;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.PaymentRepository;
import com.mehmetkerem.service.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaytrPaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final IOrderService orderService;
    private final PaytrHashService hashService;

    @Transactional
    public String handleCallback(Map<String, String> callback) {
        String merchantOid = require(callback, "merchant_oid");
        String status = require(callback, "status");
        String totalAmount = require(callback, "total_amount");
        String hash = require(callback, "hash");

        if (!hashService.isValidCallbackHash(merchantOid, status, totalAmount, hash)) {
            throw new IllegalArgumentException("PAYTR notification failed: bad hash");
        }

        Payment payment = paymentRepository.findByTransactionId(merchantOid)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, merchantOid, "PayTR ödeme")));
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            return "OK";
        }

        Order order = orderRepository.findByIdForUpdate(payment.getOrderId())
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, payment.getOrderId(), "sipariş")));

        if ("success".equals(status)) {
            payment.setPaymentStatus(PaymentStatus.PAID);
            paymentRepository.save(payment);
            if (order.getOrderStatus() != OrderStatus.PAID) {
                orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);
            }
            orderService.updatePaymentStatus(order.getId(), PaymentStatus.PAID);
            return "OK";
        }

        payment.setPaymentStatus(PaymentStatus.UNPAID);
        paymentRepository.save(payment);
        orderService.updatePaymentStatus(order.getId(), PaymentStatus.UNPAID);
        return "OK";
    }

    private String require(Map<String, String> callback, String field) {
        String value = callback.get(field);
        if (value == null || value.isBlank()) {
            throw new BadRequestException("PayTR callback alanı eksik: " + field);
        }
        return value;
    }
}
