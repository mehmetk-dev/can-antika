package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "bank_transfers")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BankTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String bankName;
    private String senderName;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    private String receiptUrl;
    private String note;

    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private String adminNote;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
