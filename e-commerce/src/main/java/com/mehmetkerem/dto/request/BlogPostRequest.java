package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostRequest {
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String imageUrl;
    private String author;
    private Long categoryId;
    private boolean published;
}
