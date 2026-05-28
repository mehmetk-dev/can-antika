package com.mehmetkerem.controller.impl;

import com.mehmetkerem.dto.response.PaytrInitializeResponse;
import com.mehmetkerem.service.payment.PaytrInitializeService;
import com.mehmetkerem.service.payment.PaytrPaymentService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import com.mehmetkerem.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/payment/paytr")
@RequiredArgsConstructor
public class RestPaytrControllerImpl {

    private final PaytrInitializeService initializeService;
    private final PaytrPaymentService paymentService;

    @PostMapping("/initialize")
    public ResultData<PaytrInitializeResponse> initialize(
            @RequestParam Long orderId,
            HttpServletRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new InsufficientAuthenticationException("Oturum gerekli");
        }
        return ResultHelper.success(initializeService.initialize(userId, orderId, resolveClientIp(request)));
    }

    @PostMapping(
            value = "/callback",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> callback(@RequestParam MultiValueMap<String, String> form) {
        Map<String, String> callback = form.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().isEmpty() ? "" : entry.getValue().get(0)));
        return ResponseEntity.ok(paymentService.handleCallback(callback));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
