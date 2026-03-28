package com.mehmetkerem.repository;

import com.mehmetkerem.model.RefreshTokenReplay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenReplayRepository extends JpaRepository<RefreshTokenReplay, Long> {
    Optional<RefreshTokenReplay> findByTokenHash(String tokenHash);

    void deleteByExpiresAtBefore(Instant instant);
}
