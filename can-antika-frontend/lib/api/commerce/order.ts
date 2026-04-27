import { api } from "../../api-client";
import type { OrderResponse, OrderRequest, OrderInvoiceResponse, OrderStatusHistoryResponse, CursorResponse } from "../../types";

export const orderApi = {
    createOrder: (data: OrderRequest) =>
        api.post<OrderResponse>("/v1/order/save", { body: data }),

    getMyOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/my-orders", {
            params: { page, size, sortBy, direction },
        }),

    getMyOrderById: (orderId: number) =>
        api.get<OrderResponse>(`/v1/order/my-orders/${orderId}`),

    getAllOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/all", {
            params: { page, size, sortBy, direction },
        }),

    searchOrders: (params: {
        status?: string; paymentStatus?: string; userId?: number;
        from?: string; to?: string; q?: string;
        page?: number; size?: number; sortBy?: string; direction?: string;
    }) =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/search", { params }),

    getInvoice: (orderId: number) =>
        api.get<OrderInvoiceResponse>(`/v1/order/${orderId}/invoice`),

    updateTracking: (orderId: number, trackingNumber: string, carrierName: string) =>
        api.put<OrderResponse>(`/v1/order/${orderId}/tracking`, {
            params: { trackingNumber, carrierName },
        }),

    cancelOrder: (orderId: number) =>
        api.post<OrderResponse>(`/v1/order/${orderId}/cancel`),

    updateOrderStatus: (orderId: number, status: string) =>
        api.put<OrderResponse>(`/v1/order/${orderId}/status`, {
            params: { status },
        }),

    getTimeline: (orderId: number) =>
        api.get<OrderStatusHistoryResponse[]>(`/v1/order/${orderId}/timeline`),

    downloadInvoicePdf: (orderId: number) =>
        api.blob("GET", `/v1/order/${orderId}/invoice/pdf`),
};
