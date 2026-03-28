package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "refresh_token_replays", indexes = {
        @Index(name = "idx_refresh_replay_user_id", columnList = "user_id"),
        @Index(name = "idx_refresh_replay_expires_at", columnList = "expires_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenReplay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
}
