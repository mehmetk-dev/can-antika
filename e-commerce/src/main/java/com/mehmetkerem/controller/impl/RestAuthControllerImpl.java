package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestAuthController;
import com.mehmetkerem.dto.request.*;
import com.mehmetkerem.dto.response.LoginResponse;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.model.User;
import com.mehmetkerem.service.IAuthService;
import com.mehmetkerem.service.IUserService;
import com.mehmetkerem.util.CookieUtil;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class RestAuthControllerImpl implements IRestAuthController {

    private final IAuthService authService;
    private final IUserService userService;
    private final CookieUtil cookieUtil;

    @Override
    @PostMapping("/register")
    public ResultData<Map<String, String>> register(@RequestBody @Valid RegisterRequest req) {
        return ResultHelper.success(authService.register(req));
    }

    @Override
    @PostMapping("/login")
    public ResultData<UserResponse> login(@RequestBody @Valid LoginRequest req, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(req);
        cookieUtil.addAccessTokenCookie(response, loginResponse.getAccessToken());
        cookieUtil.addRefreshTokenCookie(response, loginResponse.getRefreshToken());
        return ResultHelper.success(loginResponse.getUser());
    }

    @Override
    @PostMapping("/refresh-token")
    public ResultData<UserResponse> refreshToken(@RequestBody(required = false) TokenRefreshRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        // Cookie'den refresh token oku (body boşsa)
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            request = new TokenRefreshRequest();
            String cookieToken = extractRefreshTokenFromCookie(httpRequest);
            if (cookieToken == null) {
                throw new RuntimeException("Refresh token bulunamadı.");
            }
            request.setRefreshToken(cookieToken);
        }
        LoginResponse loginResponse = authService.refreshToken(request);
        cookieUtil.addAccessTokenCookie(response, loginResponse.getAccessToken());
        cookieUtil.addRefreshTokenCookie(response, loginResponse.getRefreshToken());
        return ResultHelper.success(loginResponse.getUser());
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (CookieUtil.REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    @Override
    @PostMapping("/logout")
    public ResultData<String> logout(HttpServletResponse response, Authentication authentication) {
        cookieUtil.clearTokenCookies(response);
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            authService.logout(user.getId());
        }
        return ResultHelper.success("Çıkış yapıldı.");
    }

    @Override
    @PostMapping("/forgot-password")
    public ResultData<String> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        return ResultHelper.success("Şifre sıfırlama linki e-postanıza gönderildi.");
    }

    @Override
    @PostMapping("/reset-password")
    public ResultData<String> resetPassword(@RequestBody @Valid PasswordResetRequest request) {
        authService.resetPassword(request);
        return ResultHelper.success("Şifreniz başarıyla değiştirildi.");
    }

    @Override
    @PostMapping("/change-password")
    public ResultData<String> changePassword(@RequestBody @Valid ChangePasswordRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        authService.changePassword(user.getId(), request.getOldPassword(), request.getNewPassword());
        return ResultHelper.success("Şifreniz güncellendi.");
    }

    @Override
    @PutMapping("/profile")
    public ResultData<com.mehmetkerem.dto.response.UserResponse> updateProfile(
            @RequestBody @Valid ProfileUpdateRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResultHelper.success(userService.updateProfile(user.getId(), request));
    }

    @Override
    @GetMapping("/me")
    public ResultData<com.mehmetkerem.dto.response.UserResponse> me(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResultHelper.success(userService.getUserResponseById(user.getId()));
    }
}
