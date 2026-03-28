package com.mehmetkerem.security;

import com.mehmetkerem.jwt.JwtService;
import com.mehmetkerem.model.RefreshToken;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.UserRepository;
import com.mehmetkerem.service.IRefreshTokenService;
import com.mehmetkerem.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final IRefreshTokenService refreshTokenService;
    private final CookieUtil cookieUtil;

    @Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow();

        String token = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        // Token'ları HttpOnly cookie olarak set et (AUDIT M2)
        cookieUtil.addAccessTokenCookie(response, token);
        cookieUtil.addRefreshTokenCookie(response, refreshToken.getToken());

        // Query param yerine temiz redirect
        String targetUrl = frontendUrl + "/oauth2/redirect";

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
