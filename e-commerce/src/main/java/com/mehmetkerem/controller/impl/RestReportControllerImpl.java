package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestReportController;
import com.mehmetkerem.dto.response.AbandonedCartResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.ReportResponse;
import com.mehmetkerem.service.IReportService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/admin/reports")
@RequiredArgsConstructor
public class RestReportControllerImpl implements IRestReportController {

    private final IReportService reportService;

    // Sales by category
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/sales-by-category")
    public ResultData<List<ReportResponse.SalesByCategoryReport>> salesByCategory() {
        return ResultHelper.success(reportService.salesByCategory());
    }

    // Stock report
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/stock")
    public ResultData<List<ReportResponse.StockReportItem>> stockReport(
            @RequestParam(defaultValue = "10") int threshold) {
        return ResultHelper.success(reportService.stockReport(threshold));
    }

    // Customer report
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/customers")
    public ResultData<List<ReportResponse.CustomerReportItem>> customerReport() {
        return ResultHelper.success(reportService.customerReport());
    }

    // Revenue by period
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/revenue")
    public ResultData<List<ReportResponse.RevenueByPeriod>> revenueReport(
            @RequestParam(defaultValue = "12") int months) {
        return ResultHelper.success(reportService.revenueReport(months));
    }

    // Abandoned carts
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/abandoned-carts")
    public ResultData<CursorResponse<AbandonedCartResponse>> abandonedCarts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "24") int hoursThreshold) {
        return ResultHelper.cursor(reportService.abandonedCarts(page, size, hoursThreshold));
    }
}
