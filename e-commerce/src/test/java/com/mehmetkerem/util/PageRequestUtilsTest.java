package com.mehmetkerem.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PageRequestUtilsTest {

    @Test
    void clampsInvalidPageAndSize() {
        var pageRequest = PageRequestUtils.of(-10, 10000);

        assertEquals(0, pageRequest.getPageNumber());
        assertEquals(100, pageRequest.getPageSize());
    }
}
