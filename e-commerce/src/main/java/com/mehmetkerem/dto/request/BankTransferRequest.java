package com.mehmetkerem.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferRequest {
    private Long orderId;
    private String bankName;
    private String senderName;
    private BigDecimal amount;
    private String receiptUrl;
    private String note;
}
