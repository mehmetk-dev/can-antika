package com.mehmetkerem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostResponse {
    private Long id;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String imageUrl;
    private Long categoryId;
    private String author;
    private boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
