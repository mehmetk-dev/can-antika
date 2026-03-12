import { api } from "../../api-client";
import type { CursorResponse, SalesByCategoryReport, StockReport } from "../../types";

export const reportApi = {
    salesByCategory: () =>
        api.get<SalesByCategoryReport[]>("/v1/admin/reports/sales-by-category"),

    stockReport: (threshold = 10) =>
        api.get<StockReport[]>("/v1/admin/reports/stock", {
            params: { threshold },
        }),

    customerReport: () =>
        api.get<Record<string, unknown>[]>("/v1/admin/reports/customers"),

    revenueReport: (months = 12) =>
        api.get<Record<string, unknown>[]>("/v1/admin/reports/revenue", {
            params: { months },
        }),

    abandonedCarts: (page = 0, size = 20, hoursThreshold = 24) =>
        api.get<CursorResponse<Record<string, unknown>>>("/v1/admin/reports/abandoned-carts", {
            params: { page, size, hoursThreshold },
        }),
};
