package com.mehmetkerem.mapper;

import com.mehmetkerem.model.Product;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductMapperTest {

    private final ProductMapper mapper = new ProductMapperImpl();

    @Test
    void toResponseIncludesCategoryIdForAdminFallback() {
        Product product = Product.builder()
                .id(1L)
                .title("Antika Saat")
                .categoryId(42L)
                .build();

        assertEquals(42L, mapper.toResponse(product).getCategoryId());
    }
}
