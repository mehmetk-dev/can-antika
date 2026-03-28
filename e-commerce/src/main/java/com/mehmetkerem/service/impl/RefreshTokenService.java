package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.exception.UnauthorizedException;
import com.mehmetkerem.model.RefreshToken;
import com.mehmetkerem.model.RefreshTokenReplay;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.RefreshTokenReplayRepository;
import com.mehmetkerem.repository.RefreshTokenRepository;
import com.mehmetkerem.repository.UserRepository;
import com.mehmetkerem.service.IRefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService implements IRefreshTokenService {

    @Value("${jwt.refreshExpirationMs:604800000}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenReplayRepository refreshTokenReplayRepository;
    private final UserRepository userRepository;

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));
        return createRefreshToken(user);
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);
        if (existingToken.isPresent()) {
            refreshTokenRepository.delete(existingToken.get());
            refreshTokenRepository.flush();
        }

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new UnauthorizedException("Oturum suresi doldu. Lutfen tekrar giris yapin.");
        }
        return token;
    }

    @Override
    @Transactional
    public void markTokenAsRotated(RefreshToken token) {
        if (token == null || token.getToken() == null || token.getUser() == null) {
            return;
        }

        refreshTokenReplayRepository.save(RefreshTokenReplay.builder()
                .tokenHash(hashToken(token.getToken()))
                .userId(token.getUser().getId())
                .expiresAt(token.getExpiryDate())
                .recordedAt(Instant.now())
                .build());
    }

    @Override
    @Transactional
    public void detectReplayAndRevokeIfNeeded(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenReplayRepository.deleteByExpiresAtBefore(Instant.now());

        refreshTokenReplayRepository.findByTokenHash(hashToken(rawToken)).ifPresent(replay -> {
            deleteByUserId(replay.getUserId());
            throw new UnauthorizedException("Refresh token tekrar kullanildi. Lutfen yeniden giris yapin.");
        });
    }

    @Override
    @Transactional
    public int deleteByUserId(Long userId) {
        return refreshTokenRepository.deleteByUser(userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Kullanici bulunamadi: " + userId)));
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new BadRequestException("Token islenemedi.");
        }
    }
}
