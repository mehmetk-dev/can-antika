package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopupRequest {
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
