package com.mehmetkerem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqItemResponse {
    private Long id;
    private String question;
    private String answer;
    private int displayOrder;
    private boolean active;
}
