package com.mehmetkerem.service.payment;

import com.mehmetkerem.config.PaytrProperties;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.enums.PaymentMethod;
import com.mehmetkerem.enums.PaymentStatus;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.Payment;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.PaymentRepository;
import com.mehmetkerem.service.IOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaytrPaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private IOrderService orderService;

    private PaytrPaymentService service;
    private PaytrHashService hashService;

    @BeforeEach
    void setUp() {
        PaytrProperties properties = new PaytrProperties();
        properties.setMerchantKey("merchant-key");
        properties.setMerchantSalt("merchant-salt");
        hashService = new PaytrHashService(properties);
        service = new PaytrPaymentService(paymentRepository, orderRepository, orderService, hashService);
    }

    @Test
    void handleCallback_WhenSuccess_ShouldMarkPaymentAndOrderAsPaid() {
        Payment payment = Payment.builder()
                .id(1L)
                .userId(7L)
                .orderId(10L)
                .amount(new BigDecimal("199.99"))
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionId("CA10P99")
                .build();
        Order order = Order.builder()
                .id(10L)
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(new BigDecimal("199.99"))
                .build();
        String hash = hashService.createCallbackHash("CA10P99", "success", "19999");

        when(paymentRepository.findByTransactionId("CA10P99")).thenReturn(Optional.of(payment));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = service.handleCallback(Map.of(
                "merchant_oid", "CA10P99",
                "status", "success",
                "total_amount", "19999",
                "payment_amount", "19999",
                "hash", hash));

        assertEquals("OK", result);
        verify(orderService).updateOrderStatus(10L, OrderStatus.PAID);
        verify(orderService).updatePaymentStatus(10L, PaymentStatus.PAID);
        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertEquals(PaymentStatus.PAID, paymentCaptor.getValue().getPaymentStatus());
    }

    @Test
    void handleCallback_WhenAlreadyPaid_ShouldReturnOkWithoutUpdatingAgain() {
        Payment payment = Payment.builder()
                .id(1L)
                .orderId(10L)
                .paymentStatus(PaymentStatus.PAID)
                .transactionId("CA10P99")
                .build();
        String hash = hashService.createCallbackHash("CA10P99", "success", "19999");

        when(paymentRepository.findByTransactionId("CA10P99")).thenReturn(Optional.of(payment));

        String result = service.handleCallback(Map.of(
                "merchant_oid", "CA10P99",
                "status", "success",
                "total_amount", "19999",
                "hash", hash));

        assertEquals("OK", result);
        verifyNoInteractions(orderService);
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void handleCallback_WhenHashInvalid_ShouldThrowAndNotAcknowledge() {
        assertThrows(IllegalArgumentException.class, () -> service.handleCallback(Map.of(
                "merchant_oid", "CA10P99",
                "status", "success",
                "total_amount", "19999",
                "hash", "invalid")));

        verifyNoInteractions(paymentRepository, orderRepository, orderService);
    }
}
