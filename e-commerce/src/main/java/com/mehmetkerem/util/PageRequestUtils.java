package com.mehmetkerem.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public final class PageRequestUtils {

    private static final int MAX_PAGE_SIZE = 100;

    private PageRequestUtils() {
    }

    public static PageRequest of(int page, int size) {
        return PageRequest.of(normalizePage(page), normalizeSize(size));
    }

    public static PageRequest of(int page, int size, Sort sort) {
        return PageRequest.of(normalizePage(page), normalizeSize(size), sort);
    }

    public static int normalizePage(int page) {
        return Math.max(page, 0);
    }

    public static int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }
}
