package com.mehmetkerem.service.product;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class ProductSlugGenerator {

    private static final String DEFAULT_SLUG = "urun";
    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\s-]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern DASHES = Pattern.compile("-+");

    public String toBaseSlug(String title) {
        if (title == null || title.isBlank()) {
            return DEFAULT_SLUG;
        }

        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        normalized = COMBINING_MARKS.matcher(normalized).replaceAll("");
        normalized = normalized
                .replace('\u0131', 'i')
                .replace('\u0130', 'i')
                .toLowerCase(Locale.ROOT);
        normalized = NON_ALNUM.matcher(normalized).replaceAll("");
        normalized = WHITESPACE.matcher(normalized.trim()).replaceAll("-");
        normalized = DASHES.matcher(normalized).replaceAll("-");
        normalized = trimDash(normalized);

        return normalized.isBlank() ? DEFAULT_SLUG : normalized;
    }

    public String buildCandidate(String baseSlug, int collisionIndex) {
        if (collisionIndex <= 0) {
            return baseSlug;
        }
        return baseSlug + "-" + (collisionIndex + 1);
    }

    private String trimDash(String value) {
        int start = 0;
        int end = value.length();

        while (start < end && value.charAt(start) == '-') {
            start++;
        }
        while (end > start && value.charAt(end - 1) == '-') {
            end--;
        }

        return value.substring(start, end);
    }
}
