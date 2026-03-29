package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Setter
@Entity
@Table(name = "products")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE products SET deleted = true WHERE id=? and version=?")
@SQLRestriction("deleted=false")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    private Integer stock;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "period_id")
    private Long periodId;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    @BatchSize(size = 20)
    private List<String> imageUrls;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> attributes;

    @Version
    private Long version;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean deleted = false;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "double precision default 0.0")
    private Double averageRating = 0.0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer reviewCount = 0;

    @Builder.Default
    @Column(name = "view_count", nullable = false, columnDefinition = "integer default 0")
    private Integer viewCount = 0;

    @PrePersist
    protected void onPrePersist() {
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(title);
        }
        if (stock == null) {
            stock = 0;
        }
        if (reviewCount == null) {
            reviewCount = 0;
        }
        if (viewCount == null) {
            viewCount = 0;
        }
    }

    @PreUpdate
    protected void onPreUpdate() {
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(title);
            if (id != null) {
                slug = slug + "-" + id;
            }
        }
        if (stock == null) {
            stock = 0;
        }
        if (reviewCount == null) {
            reviewCount = 0;
        }
        if (viewCount == null) {
            viewCount = 0;
        }
    }

    private String generateSlug(String text) {
        if (text == null)
            return null;
        return text.toLowerCase(java.util.Locale.forLanguageTag("tr"))
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
