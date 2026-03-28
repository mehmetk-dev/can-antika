package com.mehmetkerem.service.product;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class ProductSortResolver {

    private static final String DEFAULT_SORT_FIELD = "id";
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "title", "price", "stock", "averageRating", "reviewCount", "viewCount");

    public Sort resolve(String sortBy, String direction) {
        String safeSortBy = sanitizeSortBy(sortBy);
        return isDescending(direction)
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();
    }

    public String sanitizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return DEFAULT_SORT_FIELD;
        }
        return ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : DEFAULT_SORT_FIELD;
    }

    private boolean isDescending(String direction) {
        return "desc".equalsIgnoreCase(direction);
    }
}
