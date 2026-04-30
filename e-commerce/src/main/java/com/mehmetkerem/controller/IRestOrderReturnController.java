package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.OrderReturnRequest;
import com.mehmetkerem.dto.response.OrderReturnResponse;
import com.mehmetkerem.util.ResultData;

import java.util.List;
import java.util.Map;

public interface IRestOrderReturnController {

    ResultData<OrderReturnResponse> createReturn(OrderReturnRequest request);

    ResultData<List<OrderReturnResponse>> getMyReturns();

    ResultData<List<OrderReturnResponse>> getAllReturns();

    ResultData<Map<String, Long>> getPendingReturnCount();

    ResultData<OrderReturnResponse> approve(Long returnId);

    ResultData<OrderReturnResponse> reject(Long returnId);
}
