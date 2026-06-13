package com.mehmetkerem.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class TokenHashing {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    private TokenHashing() {
    }

    public static String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Token bos olamaz.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 kullanilamiyor.", ex);
        }
    }
}
