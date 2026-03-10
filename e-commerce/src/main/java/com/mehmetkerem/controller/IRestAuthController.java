package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.*;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.util.ResultData;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;

import java.util.Map;

public interface IRestAuthController {
    ResultData<Map<String, String>> register(RegisterRequest req);

    ResultData<UserResponse> login(LoginRequest req, HttpServletResponse response);

    ResultData<UserResponse> refreshToken(TokenRefreshRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response);

    ResultData<String> forgotPassword(String email);

    ResultData<String> resetPassword(PasswordResetRequest request);

    ResultData<String> changePassword(ChangePasswordRequest request, Authentication authentication);

    ResultData<UserResponse> updateProfile(ProfileUpdateRequest request,
            Authentication authentication);

    ResultData<UserResponse> me(Authentication authentication);

    ResultData<String> logout(HttpServletResponse response, Authentication authentication);
}
