package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class ProductRequest {

    @NotBlank(message = "Urun adi bos olamaz.")
    @Size(max = 500, message = "Urun adi 500 karakteri gecemez.")
    private String title;

    @Size(max = 4000, message = "Aciklama 4000 karakteri gecemez.")
    private String description;

    @NotNull(message = "Fiyat bos olamaz.")
    @Positive(message = "Fiyat 0'dan buyuk olmali.")
    private BigDecimal price;

    @NotNull(message = "Stok adedi bos olamaz.")
    @PositiveOrZero(message = "Stok adedi eksi olamaz.")
    private Integer stock;

    @NotNull(message = "Kategori ID bos olamaz.")
    private Long categoryId;

    private Long periodId;

    @Size(max = 120, message = "Donem adi 120 karakteri gecemez.")
    private String periodName;

    private List<@NotBlank(message = "Gorsel URL'i bos olamaz.") String> imageUrls;

    private Map<String, Object> attributes;
}
