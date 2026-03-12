package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestBankTransferController;
import com.mehmetkerem.dto.request.BankTransferRequest;
import com.mehmetkerem.dto.response.BankTransferResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.model.BankTransfer;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.service.IBankTransferService;
import com.mehmetkerem.service.IOrderService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import com.mehmetkerem.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RestBankTransferControllerImpl implements IRestBankTransferController {

    private final IBankTransferService bankTransferService;
    private final IOrderService orderService;
    private final com.mehmetkerem.service.IOrderAuthorizationService orderAuthorizationService;

    private BankTransferResponse toResponse(BankTransfer t) {
        return BankTransferResponse.builder()
                .id(t.getId()).orderId(t.getOrderId()).userId(t.getUserId())
                .userName(t.getUserName()).userEmail(t.getUserEmail())
                .bankName(t.getBankName()).senderName(t.getSenderName())
                .amount(t.getAmount()).receiptUrl(t.getReceiptUrl())
                .note(t.getNote()).status(t.getStatus())
                .adminNote(t.getAdminNote()).createdAt(t.getCreatedAt()).build();
    }

    private BankTransfer toEntity(BankTransferRequest req) {
        BankTransfer t = new BankTransfer();
        t.setOrderId(req.getOrderId());
        t.setBankName(req.getBankName());
        t.setSenderName(req.getSenderName());
        t.setAmount(req.getAmount());
        t.setReceiptUrl(req.getReceiptUrl());
        t.setNote(req.getNote());
        return t;
    }

    @Override
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/v1/bank-transfers")
    public ResultData<BankTransferResponse> submitTransfer(@RequestBody BankTransferRequest req) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new BadRequestException("Oturum açmanız gerekiyor.");
        }
        validateTransferRequest(req, currentUserId);

        BankTransfer transfer = toEntity(req);
        transfer.setUserId(currentUserId);
        if (SecurityUtils.getCurrentUser() != null) {
            transfer.setUserName(SecurityUtils.getCurrentUser().getName());
            transfer.setUserEmail(SecurityUtils.getCurrentUser().getEmail());
        }

        return ResultHelper.success(toResponse(bankTransferService.submitTransfer(transfer)));
    }

    private void validateTransferRequest(BankTransferRequest req, Long currentUserId) {
        if (req.getOrderId() == null) {
            throw new BadRequestException("Sipariş ID zorunludur.");
        }
        if (req.getAmount() == null) {
            throw new BadRequestException("Tutar zorunludur.");
        }

        Order order = orderService.getOrderById(req.getOrderId());
        orderAuthorizationService.assertOwner(order, currentUserId);
        if (order.getPaymentStatus() != com.mehmetkerem.enums.PaymentStatus.PENDING) {
            throw new BadRequestException("Yalnızca bekleyen ödemeler için havale bildirimi yapılabilir.");
        }
        if (order.getTotalAmount() == null || req.getAmount().compareTo(order.getTotalAmount()) != 0) {
            throw new BadRequestException("Havale tutarı sipariş tutarıyla eşleşmiyor.");
        }
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/bank-transfers")
    public ResultData<CursorResponse<BankTransferResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Page<BankTransfer> result = bankTransferService.getAll(page, size, status);
        CursorResponse<BankTransferResponse> cursor = new CursorResponse<>();
        cursor.setItems(result.getContent().stream().map(this::toResponse).toList());
        cursor.setTotalElement(result.getTotalElements());
        cursor.setPageNumber(result.getNumber());
        cursor.setPageSize(result.getSize());
        return ResultHelper.success(cursor);
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/bank-transfers/pending-count")
    public ResultData<Map<String, Long>> getPendingCount() {
        return ResultHelper.success(Map.of("count", bankTransferService.getPendingCount()));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/bank-transfers/{id}")
    public ResultData<BankTransferResponse> updateTransfer(@PathVariable Long id, @RequestBody BankTransferRequest req) {
        return ResultHelper.success(toResponse(bankTransferService.updateTransfer(id, toEntity(req))));
    }
}

