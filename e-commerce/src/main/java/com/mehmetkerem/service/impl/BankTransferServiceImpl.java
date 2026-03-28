package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.BankTransfer;
import com.mehmetkerem.repository.BankTransferRepository;
import com.mehmetkerem.service.IBankTransferService;
import com.mehmetkerem.service.IOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankTransferServiceImpl implements IBankTransferService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";

    private final BankTransferRepository repository;
    private final IOrderService orderService;

    @Override
    public BankTransfer submitTransfer(BankTransfer transfer) {
        transfer.setStatus(STATUS_PENDING);
        return repository.save(transfer);
    }

    @Override
    public Page<BankTransfer> getAll(int page, int size, String status) {
        if (status != null && !status.isBlank()) {
            return repository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        }
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Override
    public long getPendingCount() {
        return repository.countByStatus(STATUS_PENDING);
    }

    @Override
    @Transactional
    public BankTransfer updateTransfer(Long id, BankTransfer transfer) {
        BankTransfer existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Havale bildirimi bulunamadı: " + id));
        if (transfer.getStatus() != null) {
            existing.setStatus(transfer.getStatus());
            if (STATUS_APPROVED.equals(transfer.getStatus()) && existing.getOrderId() != null) {
                orderService.updateOrderStatus(existing.getOrderId(), com.mehmetkerem.enums.OrderStatus.PAID);
                orderService.updatePaymentStatus(existing.getOrderId(), com.mehmetkerem.enums.PaymentStatus.PAID);
            }
        }
        if (transfer.getAdminNote() != null) existing.setAdminNote(transfer.getAdminNote());
        return repository.save(existing);
    }
}

