package com.mehmetkerem.service;

import com.mehmetkerem.dto.response.AbandonedCartResponse;
import com.mehmetkerem.dto.response.ReportResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IReportService {
    List<ReportResponse.SalesByCategoryReport> salesByCategory();
    List<ReportResponse.StockReportItem> stockReport(int threshold);
    List<ReportResponse.CustomerReportItem> customerReport();
    List<ReportResponse.RevenueByPeriod> revenueReport(int months);
    Page<AbandonedCartResponse> abandonedCarts(int page, int size, int hoursThreshold);
}
