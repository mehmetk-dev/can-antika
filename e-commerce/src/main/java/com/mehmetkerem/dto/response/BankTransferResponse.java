package com.mehmetkerem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String bankName;
    private String senderName;
    private BigDecimal amount;
    private String receiptUrl;
    private String note;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
}
