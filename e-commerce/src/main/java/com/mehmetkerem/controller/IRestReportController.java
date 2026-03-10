package com.mehmetkerem.controller;

import com.mehmetkerem.dto.response.AbandonedCartResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.ReportResponse;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestReportController {
    ResultData<List<ReportResponse.SalesByCategoryReport>> salesByCategory();
    ResultData<List<ReportResponse.StockReportItem>> stockReport(int threshold);
    ResultData<List<ReportResponse.CustomerReportItem>> customerReport();
    ResultData<List<ReportResponse.RevenueByPeriod>> revenueReport(int months);
    ResultData<CursorResponse<AbandonedCartResponse>> abandonedCarts(int page, int size, int hoursThreshold);
}
