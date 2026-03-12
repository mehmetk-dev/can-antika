package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.LoginRequest;
import com.mehmetkerem.dto.request.PasswordResetRequest;
import com.mehmetkerem.dto.request.RegisterRequest;
import com.mehmetkerem.dto.request.TokenRefreshRequest;
import com.mehmetkerem.dto.response.LoginResponse;
import com.mehmetkerem.enums.Role;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.jwt.JwtService;
import com.mehmetkerem.model.PasswordResetToken;
import com.mehmetkerem.model.RefreshToken;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.PasswordResetTokenRepository;
import com.mehmetkerem.repository.UserRepository;
import com.mehmetkerem.service.INotificationService;
import com.mehmetkerem.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService implements com.mehmetkerem.service.IAuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final IUserService userService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final com.mehmetkerem.service.IRefreshTokenService refreshTokenService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public Map<String, String> register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException(String.format(ExceptionMessages.EMAIL_ALL_READY_EXISTS, email));
        }

        var user = User.builder()
                .email(email)
                .name(req.getName())
                .passwordHash(encoder.encode(req.getPassword()))
                .role(Role.USER) // Güvenlik: Her zaman USER rolü ile başlar.
                .build();
        userRepository.save(user);

        // Send Welcome Email
        eventPublisher.publishEvent(new com.mehmetkerem.event.UserRegisteredEvent(this, user.getEmail(), user.getName()));

        String token = jwtService.generateToken(user);
        return Map.of("token", token);
    }

    @Override
    public LoginResponse login(LoginRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.getPassword()));
        var user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, email, "kullanıcı")));
        String token = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return LoginResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken.getToken())
                .user(userService.getUserResponseById(user.getId()))
                .build();
    }

    @Override
    public LoginResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtService.generateToken(user);
                    // Rotate refresh token — invalidate old, issue new
                    refreshTokenService.deleteByUserId(user.getId());
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    return LoginResponse.builder()
                            .accessToken(token)
                            .refreshToken(newRefreshToken.getToken())
                            .user(userService.getUserResponseById(user.getId()))
                            .build();
                })
                .orElseThrow(() -> new BadRequestException("Refresh token is not in database!"));
    }

    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Kullanıcı bulunamadı: " + email));

        String token = UUID.randomUUID().toString();
        userService.createPasswordResetTokenForUser(user, token);

        String link = frontendUrl.replaceAll("/$", "") + "/reset-password?token=" + token;
        eventPublisher.publishEvent(new com.mehmetkerem.event.ForgotPasswordEvent(this, email, link));
    }

    @Override
    public void resetPassword(PasswordResetRequest request) {
        String validationResult = userService.validatePasswordResetToken(request.getToken());

        if (validationResult != null) {
            throw new BadRequestException("Geçersiz veya süresi dolmuş token: " + validationResult);
        }

        PasswordResetToken passToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Token bulunamadı"));

        User user = passToken.getUser();
        userService.changeUserPassword(user, request.getNewPassword());
        passwordResetTokenRepository.delete(passToken);
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userService.getUserById(userId);

        if (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty()) {
            if (!encoder.matches(oldPassword, user.getPasswordHash())) {
                throw new BadRequestException("Mevcut şifre hatalı.");
            }
        }

        userService.changeUserPassword(user, newPassword);
    }

    @Override
    public void logout(Long userId) {
        refreshTokenService.deleteByUserId(userId);
    }
}
