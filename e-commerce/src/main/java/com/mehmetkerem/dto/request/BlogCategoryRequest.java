package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogCategoryRequest {
    @NotBlank(message = "Kategori adı zorunludur.")
    @Size(max = 100, message = "Kategori adı 100 karakteri geçemez.")
    private String name;
    @NotBlank(message = "Slug zorunludur.")
    @Size(max = 120, message = "Slug 120 karakteri geçemez.")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug yalnızca küçük harf, rakam ve tire içerebilir.")
    private String slug;
    private boolean active;
}
