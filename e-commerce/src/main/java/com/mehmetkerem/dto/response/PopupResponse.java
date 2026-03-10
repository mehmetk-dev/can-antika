package com.mehmetkerem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopupResponse {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private String linkUrl;
    private String linkText;
    private boolean active;
    private String position;
    private int delaySeconds;
    private boolean showOnce;
}
