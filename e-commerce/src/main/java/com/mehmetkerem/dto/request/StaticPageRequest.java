package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageRequest {
    @NotBlank(message = "Başlık zorunludur")
    private String title;
    private String slug;

    @NotBlank(message = "İçerik zorunludur")
    private String content;

    private boolean active;
}
