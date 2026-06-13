-- Existing plaintext tokens are intentionally invalidated during the security migration.
DELETE FROM refresh_tokens;
DELETE FROM password_reset_tokens;

ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
ALTER TABLE password_reset_tokens RENAME COLUMN token TO token_hash;
