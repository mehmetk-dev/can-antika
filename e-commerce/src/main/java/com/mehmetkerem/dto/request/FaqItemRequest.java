package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqItemRequest {
    private String question;
    private String answer;
    private int displayOrder;
    private boolean active;
}
