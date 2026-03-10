package com.mehmetkerem.service;

import com.mehmetkerem.model.BankTransfer;
import org.springframework.data.domain.Page;

public interface IBankTransferService {
    BankTransfer submitTransfer(BankTransfer transfer);
    Page<BankTransfer> getAll(int page, int size, String status);
    long getPendingCount();
    BankTransfer updateTransfer(Long id, BankTransfer transfer);
}
