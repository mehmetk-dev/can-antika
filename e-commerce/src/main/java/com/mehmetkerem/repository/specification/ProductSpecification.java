package com.mehmetkerem.repository.specification;

import com.mehmetkerem.model.Product;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

public class ProductSpecification {

    /**
     * Ürün başlığına göre arama yapar (Case-insensitive LIKE sorgusu).
     * 
     * @param title Aranacak kelime
     * @return Specification filtresi
     */
    public static Specification<Product> hasTitle(String title) {
        return (root, query, criteriaBuilder) -> {
            if (title == null || title.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(criteriaBuilder.lower(root.get("title")),
                    "%" + title.toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%");
        };
    }

    /**
     * Ürün kategorisine göre filtreleme yapar.
     * 
     * @param categoryId Kategori ID
     * @return Specification filtresi
     */
    public static Specification<Product> hasCategory(Long categoryId) {
        return (root, query, criteriaBuilder) -> {
            if (categoryId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("categoryId"), categoryId);
        };
    }

    public static Specification<Product> hasCategories(List<Long> categoryIds) {
        return (root, query, criteriaBuilder) -> {
            if (categoryIds == null || categoryIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get("categoryId").in(categoryIds);
        };
    }

    public static Specification<Product> hasPeriod(Long periodId) {
        return (root, query, criteriaBuilder) -> {
            if (periodId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("periodId"), periodId);
        };
    }

    public static Specification<Product> hasPeriods(List<Long> periodIds) {
        return (root, query, criteriaBuilder) -> {
            if (periodIds == null || periodIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get("periodId").in(periodIds);
        };
    }

    /**
     * Ürün fiyat aralığına göre filtreleme yapar.
     * 
     * @param minPrice Minimum fiyat
     * @param maxPrice Maksimum fiyat
     * @return Specification filtresi
     */
    public static Specification<Product> priceBetween(BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) -> {
            if (minPrice == null && maxPrice == null) {
                return criteriaBuilder.conjunction();
            }
            if (minPrice != null && maxPrice != null) {
                return criteriaBuilder.between(root.get("price"), minPrice, maxPrice);
            }
            if (minPrice != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice);
        };
    }

    /**
     * Ürün ortalama puanına göre (minimum puan) filtreleme yapar.
     * 
     * @param minRating Minimum puan (örneğin 4.0 ve üzeri)
     * @return Specification filtresi
     */
    public static Specification<Product> greaterThanRating(Double minRating) {
        return (root, query, criteriaBuilder) -> {
            if (minRating == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.greaterThanOrEqualTo(root.get("averageRating"), minRating);
        };
    }
}
