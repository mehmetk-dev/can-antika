package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostRequest {
    @NotBlank(message = "Başlık zorunludur")
    private String title;

    private String slug;
    private String summary;

    @NotBlank(message = "İçerik zorunludur")
    private String content;
    private String imageUrl;
    private String author;

    @NotNull(message = "Kategori zorunludur")
    @Positive(message = "Geçerli bir kategori seçiniz")
    private Long categoryId;

    private boolean published;
}
