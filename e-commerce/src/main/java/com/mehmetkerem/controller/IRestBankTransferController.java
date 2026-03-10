package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.BankTransferRequest;
import com.mehmetkerem.dto.response.BankTransferResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.util.ResultData;

import java.util.Map;

public interface IRestBankTransferController {
    ResultData<BankTransferResponse> submitTransfer(BankTransferRequest req);
    ResultData<CursorResponse<BankTransferResponse>> getAll(int page, int size, String status);
    ResultData<Map<String, Long>> getPendingCount();
    ResultData<BankTransferResponse> updateTransfer(Long id, BankTransferRequest req);
}

