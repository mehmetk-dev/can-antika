package com.mehmetkerem.aspect;

import com.mehmetkerem.dto.response.ReviewResponse;
import com.mehmetkerem.enums.ActivityType;
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
public class FeedbackLoggingAspect {

    private final IActivityLogService activityLogService;

    // ── Yorum ──

    @AfterReturning(pointcut = "execution(* com.mehmetkerem.service.impl.ReviewServiceImpl.saveReview(..))", returning = "result")
    public void logReviewCreate(JoinPoint joinPoint, Object result) {
        Long userId = (Long) joinPoint.getArgs()[0];
        if (result instanceof ReviewResponse review) {
            logActivity(ActivityType.REVIEW_CREATE, userId, "Review", review.getId(),
                    String.format("Yeni yorum eklendi. Ürün: %s, Puan: %s",
                            review.getProduct() != null ? review.getProduct().getTitle() : "?",
                            review.getRating()));
        }
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.ReviewServiceImpl.deleteReview(..))")
    public void logReviewDelete(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        Long reviewId = (Long) args[1];
        logActivity(ActivityType.REVIEW_DELETE, userId, "Review", reviewId,
                "Yorum silindi. Yorum ID: " + reviewId);
    }

    // ── Adres ──

    @AfterReturning("execution(* com.mehmetkerem.service.impl.AddressServiceImpl.saveAddress(..))")
    public void logAddressCreate(JoinPoint joinPoint) {
        Long userId = (Long) joinPoint.getArgs()[0];
        logActivity(ActivityType.ADDRESS_CREATE, userId, "Address", null, "Yeni adres eklendi");
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.AddressServiceImpl.deleteAddressForUser(..))")
    public void logAddressDelete(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long addressId = (Long) args[0];
        Long userId = (Long) args[1];
        logActivity(ActivityType.ADDRESS_DELETE, userId, "Address", addressId,
                "Adres silindi. Adres ID: " + addressId);
    }

    // ── Destek Talepleri ──

    @AfterReturning("execution(* com.mehmetkerem.service.impl.SupportTicketServiceImpl.createTicket(..))")
    public void logTicketCreate(JoinPoint joinPoint) {
        User currentUser = SecurityUtils.getCurrentUser();
        Long userId = currentUser != null ? currentUser.getId() : null;
        logActivity(ActivityType.TICKET_CREATE, userId, "SupportTicket", null,
                "Yeni destek talebi oluşturuldu");
    }

    private void logActivity(ActivityType type, Long userId, String entityType,
            Long entityId, String description) {
        User user = SecurityUtils.getCurrentUser();
        String email = user != null ? user.getEmail() : null;
        activityLogService.log(type, userId, email, entityType, entityId, description, null);
    }
}
