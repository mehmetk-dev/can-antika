package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "coupons")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private BigDecimal discountAmount;

    /** İndirim tipi: FIXED veya PERCENTAGE */
    private String discountType;

    @Column(nullable = false)
    private LocalDateTime expirationDate;

    /** Minimum sepet tutarı */
    private BigDecimal minCartAmount;

    private boolean isActive;

    /** Maksimum toplam kullanım sayısı (null veya 0 ise sınırsız) */
    private Integer maxUsageCount;

    /** Kullanıcı başına kullanım limiti */
    private Integer perUserLimit;

    /** Kuponun açıklaması */
    private String description;

    /** Mevcut kullanım sayısı */
    @Builder.Default
    private int usageCount = 0;
}

