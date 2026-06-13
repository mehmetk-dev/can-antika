package com.mehmetkerem.dto.request;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
    @Positive(message = "Sipariş ID pozitif olmalıdır.")
    private Long orderId;
    @Size(max = 100, message = "Banka adı 100 karakteri geçemez.")
    private String bankName;
    @Size(max = 100, message = "Gönderen adı 100 karakteri geçemez.")
    private String senderName;
    @Positive(message = "Tutar pozitif olmalıdır.")
    private BigDecimal amount;
    @Size(max = 2048, message = "Dekont URL'si 2048 karakteri geçemez.")
    private String receiptUrl;
    @Size(max = 1000, message = "Not 1000 karakteri geçemez.")
    private String note;
}
