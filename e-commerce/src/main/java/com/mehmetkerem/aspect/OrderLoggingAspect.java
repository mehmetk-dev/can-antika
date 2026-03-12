package com.mehmetkerem.aspect;

import com.mehmetkerem.dto.response.OrderResponse;
import com.mehmetkerem.dto.response.PaymentResponse;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.model.User;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class OrderLoggingAspect {

    private final IActivityLogService activityLogService;

    // ── Sipariş ──

    @AfterReturning(pointcut = "execution(* com.mehmetkerem.service.impl.OrderServiceImpl.saveOrder(..))", returning = "result")
    public void logOrderCreate(JoinPoint joinPoint, Object result) {
        Long userId = (Long) joinPoint.getArgs()[0];
        if (result instanceof OrderResponse order) {
            logActivity(ActivityType.ORDER_CREATE, userId, "Order", order.getId(),
                    String.format("Yeni sipariş oluşturuldu. Sipariş ID: %d, Toplam: %s",
                            order.getId(), order.getTotalAmount()));
        }
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.OrderServiceImpl.cancelOrder(..))")
    public void logOrderCancel(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long orderId = (Long) args[0];
        Long userId = (Long) args[1];
        logActivity(ActivityType.ORDER_CANCEL, userId, "Order", orderId,
                "Sipariş iptal edildi. Sipariş ID: " + orderId);
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.OrderServiceImpl.updateOrderStatus(..))")
    public void logOrderStatusUpdate(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long orderId = (Long) args[0];
        OrderStatus newStatus = (OrderStatus) args[1];
        User currentUser = SecurityUtils.getCurrentUser();
        Long userId = currentUser != null ? currentUser.getId() : null;
        logActivity(ActivityType.ORDER_STATUS_UPDATE, userId, "Order", orderId,
                String.format("Sipariş durumu güncellendi → %s. Sipariş ID: %d",
                        newStatus, orderId));
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.OrderServiceImpl.updateOrderTracking(..))")
    public void logOrderTracking(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long orderId = (Long) args[0];
        String trackingNumber = (String) args[1];
        String carrier = (String) args[2];
        User currentUser = SecurityUtils.getCurrentUser();
        Long userId = currentUser != null ? currentUser.getId() : null;
        logActivity(ActivityType.ORDER_TRACKING_UPDATE, userId, "Order", orderId,
                String.format("Kargo takip güncellendi. Sipariş: %d, Takip No: %s, Kargo: %s",
                        orderId, trackingNumber, carrier));
    }

    // ── Ödeme ──

    @AfterReturning(pointcut = "execution(* com.mehmetkerem.service.impl.PaymentServiceImpl.processPayment(..))", returning = "result")
    public void logPayment(JoinPoint joinPoint, Object result) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        Long orderId = (Long) args[1];
        if (result instanceof PaymentResponse payment) {
            ActivityType type = payment.getPaymentStatus() == com.mehmetkerem.enums.PaymentStatus.PAID
                    ? ActivityType.PAYMENT_SUCCESS
                    : ActivityType.PAYMENT_FAIL;
            logActivity(type, userId, "Payment", payment.getId(),
                    String.format("Ödeme %s. Sipariş: %d, Tutar: %s, Yöntem: %s",
                            type == ActivityType.PAYMENT_SUCCESS ? "başarılı" : "başarısız",
                            orderId, payment.getAmount(), payment.getPaymentMethod()));
        }
    }

    // ── İade ──

    @AfterReturning("execution(* com.mehmetkerem.service.impl.OrderReturnServiceImpl.createReturn(..))")
    public void logReturnRequest(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        com.mehmetkerem.dto.request.OrderReturnRequest request =
                (com.mehmetkerem.dto.request.OrderReturnRequest) args[1];
        logActivity(ActivityType.RETURN_REQUEST, userId, "OrderReturn", request.getOrderId(),
                String.format("İade talebi oluşturuldu. Sipariş ID: %d, Sebep: %s",
                        request.getOrderId(), request.getReason()));
    }

    private void logActivity(ActivityType type, Long userId, String entityType,
            Long entityId, String description) {
        User user = SecurityUtils.getCurrentUser();
        String email = user != null ? user.getEmail() : null;
        activityLogService.log(type, userId, email, entityType, entityId, description, null);
    }
}
