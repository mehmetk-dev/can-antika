package com.mehmetkerem.aspect;

import com.mehmetkerem.dto.request.LoginRequest;
import com.mehmetkerem.dto.request.RegisterRequest;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.service.IActivityLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class AuthLoggingAspect {

    private final IActivityLogService activityLogService;

    @AfterReturning("execution(* com.mehmetkerem.service.impl.AuthService.login(..))")
    public void logLogin(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args.length > 0 && args[0] instanceof LoginRequest request) {
            activityLogService.log(ActivityType.LOGIN, null, request.getEmail(),
                    "User", null, "Giriş yapıldı: " + request.getEmail(), null);
        }
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.AuthService.register(..))")
    public void logRegister(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args.length > 0 && args[0] instanceof RegisterRequest request) {
            activityLogService.log(ActivityType.REGISTER, null, request.getEmail(),
                    "User", null,
                    "Yeni kayıt: " + request.getName() + " (" + request.getEmail() + ")", null);
        }
    }
}
