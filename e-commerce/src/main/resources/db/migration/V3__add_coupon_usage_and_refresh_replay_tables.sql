CREATE TABLE IF NOT EXISTS coupon_usages (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_coupon_usage_coupon_user UNIQUE (coupon_id, user_id),
    CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usages(user_id);

CREATE TABLE IF NOT EXISTS refresh_token_replays (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_replay_user_id ON refresh_token_replays(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_replay_expires_at ON refresh_token_replays(expires_at);
