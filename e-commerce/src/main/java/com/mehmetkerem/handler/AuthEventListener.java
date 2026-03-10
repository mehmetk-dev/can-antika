package com.mehmetkerem.handler;

import com.mehmetkerem.event.ForgotPasswordEvent;
import com.mehmetkerem.event.UserRegisteredEvent;
import com.mehmetkerem.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthEventListener {

    private final INotificationService notificationService;

    // Eğer transaction yoksa bile dinleyebilmesi için fallbackExecution eklendi
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("Sending welcome email to: {}", event.getEmail());
        try {
            notificationService.sendWelcomeEmail(event.getEmail(), event.getName());
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", event.getEmail(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleForgotPasswordEvent(ForgotPasswordEvent event) {
        log.info("Sending password reset link to: {}", event.getEmail());
        try {
            notificationService.sendPasswordResetLink(event.getEmail(), event.getLink());
        } catch (Exception e) {
            log.error("Failed to send password reset link to {}: {}", event.getEmail(), e.getMessage());
        }
    }
}
