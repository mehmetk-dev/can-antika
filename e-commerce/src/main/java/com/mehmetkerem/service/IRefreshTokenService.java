package com.mehmetkerem.service;

import com.mehmetkerem.model.RefreshToken;
import com.mehmetkerem.model.User;

import java.util.Optional;

public interface IRefreshTokenService {

    Optional<RefreshToken> findByToken(String token);

    RefreshToken createRefreshToken(Long userId);
    RefreshToken createRefreshToken(User user);

    RefreshToken verifyExpiration(RefreshToken token);

    void markTokenAsRotated(RefreshToken token);

    void detectReplayAndRevokeIfNeeded(String rawToken);

    int deleteByUserId(Long userId);
}
