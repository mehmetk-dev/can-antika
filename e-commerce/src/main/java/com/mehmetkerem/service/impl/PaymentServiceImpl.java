package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.PaymentResponse;
import com.mehmetkerem.enums.PaymentMethod;
import com.mehmetkerem.enums.PaymentStatus;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.Payment;
import com.mehmetkerem.mapper.PaymentMapper;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.PaymentRepository;
import com.mehmetkerem.service.IPaymentService;
import com.mehmetkerem.service.payment.PaymentStrategy;
import com.mehmetkerem.util.Messages;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements IPaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final com.mehmetkerem.service.IUserService userService;
    private final com.mehmetkerem.service.IOrderService orderService;
    private final PaymentStrategy paymentStrategy;
    private final PaymentMapper paymentMapper;
    private final com.mehmetkerem.service.IOrderAuthorizationService orderAuthorizationService;

    @Transactional
    @Override
    public PaymentResponse processPayment(Long userId, Long orderId, BigDecimal amount, PaymentMethod paymentMethod,
            String idempotencyKey) {
        String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
        Payment existingByIdempotency = resolveExistingByIdempotency(normalizedIdempotencyKey, userId);
        if (existingByIdempotency != null) {
            return toResponse(existingByIdempotency);
        }

        log.info("Ã–deme iÅŸlemi baÅŸlatÄ±ldÄ±. KullanÄ±cÄ± ID: {}, SipariÅŸ ID: {}, Tutar: {}", userId, orderId, amount);
        userService.getUserById(userId);
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, orderId, "siparis")));
        orderAuthorizationService.assertOwner(order, userId);

        // SipariÅŸ durumu kontrolÃ¼ â€” sadece PENDING sipariÅŸlere Ã¶deme yapÄ±labilir
        if (order.getOrderStatus() != com.mehmetkerem.enums.OrderStatus.PENDING) {
            throw new BadRequestException(
                    "Bu sipariÅŸe Ã¶deme yapÄ±lamaz. SipariÅŸ durumu: " + order.getOrderStatus());
        }

        // MÃ¼kerrer Ã¶deme kontrolÃ¼ â€” aynÄ± sipariÅŸe daha Ã¶nce baÅŸarÄ±lÄ± Ã¶deme yapÄ±lmÄ±ÅŸ mÄ±
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Bu sipariÅŸ iÃ§in zaten Ã¶deme yapÄ±lmÄ±ÅŸ.");
        }

        // Tutar doÄŸrulama â€” gÃ¶nderilen tutar sipariÅŸ toplamÄ±yla eÅŸleÅŸmeli
        paymentRepository.findTopByOrderIdAndPaymentStatusOrderByIdDesc(orderId, PaymentStatus.PAID)
                .ifPresent(payment -> {
                    throw new BadRequestException("Bu sipariÅŸ iÃ§in zaten baÅŸarÄ±lÄ± bir Ã¶deme kaydÄ± bulunuyor.");
                });

        if (amount.compareTo(order.getTotalAmount()) != 0) {
            log.warn("Ã–deme tutarÄ± uyuÅŸmazlÄ±ÄŸÄ±. Beklenen: {}, GÃ¶nderilen: {}",
                    order.getTotalAmount(), amount);
            throw new BadRequestException(
                    String.format("Ã–deme tutarÄ± sipariÅŸ toplamÄ± ile eÅŸleÅŸmiyor. Beklenen: %s, GÃ¶nderilen: %s",
                            order.getTotalAmount(), amount));
        }

        boolean isSuccess = paymentStrategy.pay(amount);
        log.debug("Ã–deme stratejisi sonucu: {} (Strateji: {})", isSuccess, paymentStrategy.getClass().getSimpleName());

        PaymentStatus finalStatus = isSuccess ? PaymentStatus.PAID : PaymentStatus.UNPAID;

        if (isSuccess) {
            log.info("Ã–deme baÅŸarÄ±lÄ±! SipariÅŸ durumu gÃ¼ncelleniyor. SipariÅŸ ID: {}", orderId);
            orderService.updateOrderStatus(orderId, com.mehmetkerem.enums.OrderStatus.PAID);
            orderService.updatePaymentStatus(orderId, PaymentStatus.PAID);
        } else {
            log.warn("Ã–deme baÅŸarÄ±sÄ±z. KullanÄ±cÄ± ID: {}, SipariÅŸ ID: {}", userId, orderId);
        }

        Payment payment = Payment.builder()
                .userId(userId)
                .orderId(orderId)
                .amount(amount)
                .paymentStatus(finalStatus)
                .paymentMethod(paymentMethod)
                .idempotencyKey(normalizedIdempotencyKey)
                .createdAt(LocalDateTime.now())
                .build();

        Payment savedPayment;
        try {
            savedPayment = paymentRepository.save(payment);
        } catch (DataIntegrityViolationException ex) {
            if (normalizedIdempotencyKey != null) {
                Payment existing = paymentRepository.findByIdempotencyKey(normalizedIdempotencyKey)
                        .orElseThrow(() -> ex);
                if (!existing.getUserId().equals(userId)) {
                    throw new BadRequestException("Idempotency anahtarÄ± baÅŸka bir kullanÄ±cÄ±ya ait.");
                }
                return toResponse(existing);
            }
            throw ex;
        }
        log.info("Ã–deme kaydÄ± oluÅŸturuldu. Ã–deme ID: {}, Durum: {}", savedPayment.getId(), finalStatus);

        return toResponse(savedPayment);
    }

    @Override
    public PaymentResponse getPaymentResponseById(Long id) {
        return toResponse(getPaymentById(id));
    }

    @Override
    public PaymentResponse getPaymentResponseByIdAndUserId(Long id, Long userId) {
        Payment payment = getPaymentById(id);
        if (!payment.getUserId().equals(userId)) {
            throw new BadRequestException("Bu Ã¶demeye eriÅŸim yetkiniz yok.");
        }
        return toResponse(payment);
    }

    @Override
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "Ã¶deme")));
    }

    @Override
    public List<PaymentResponse> getPaymentsByUser(Long userId) {
        log.debug("KullanÄ±cÄ± Ã¶demeleri getiriliyor. KullanÄ±cÄ± ID: {}", userId);
        return paymentRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    @Override
    public PaymentResponse updatePaymentStatus(Long paymentId, PaymentStatus newStatus) {
        log.info("Ã–deme durumu gÃ¼ncelleniyor. Ã–deme ID: {}, Yeni Durum: {}", paymentId, newStatus);
        Payment payment = getPaymentById(paymentId);
        payment.setPaymentStatus(newStatus);
        return toResponse(paymentRepository.save(payment));
    }

    @Override
    public String deletePayment(Long id) {
        log.warn("Ã–deme kaydÄ± siliniyor. Ã–deme ID: {}", id);
        paymentRepository.delete(getPaymentById(id));
        return String.format(Messages.DELETE_VALUE, id, "Ã¶deme");
    }

    private PaymentResponse toResponse(Payment payment) {
        return paymentMapper.toResponseWithDetails(
                payment,
                orderService.getOrderResponseById(payment.getOrderId()),
                userService.getUserResponseById(payment.getUserId()));
    }

    private Payment resolveExistingByIdempotency(String idempotencyKey, Long userId) {
        if (idempotencyKey == null) {
            return null;
        }
        return paymentRepository.findByIdempotencyKey(idempotencyKey)
                .map(existing -> {
                    if (!existing.getUserId().equals(userId)) {
                        throw new BadRequestException("Idempotency anahtarÄ± baÅŸka bir kullanÄ±cÄ±ya ait.");
                    }
                    return existing;
                })
                .orElse(null);
    }

    private String normalizeIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null) {
            return null;
        }
        String trimmed = idempotencyKey.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

