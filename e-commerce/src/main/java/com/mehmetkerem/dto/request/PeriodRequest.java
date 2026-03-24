package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PeriodRequest {

    @NotBlank(message = "Dönem adı boş olamaz.")
    @Size(max = 120, message = "Dönem adı 120 karakteri geçemez.")
    private String name;

    private Boolean active;
}
