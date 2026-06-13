package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandRequest {
    @NotBlank(message = "Marka adı zorunludur.")
    @Size(max = 100, message = "Marka adı 100 karakteri geçemez.")
    private String name;
    @Size(max = 2048, message = "Logo URL'si 2048 karakteri geçemez.")
    private String logoUrl;
    private boolean active;
}
