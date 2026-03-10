package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageRequest {
    private String title;
    private String slug;
    private String content;
    private boolean active;
}
