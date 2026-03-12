import { api } from "../api-client";
import type { OrderResponse, OrderRequest, OrderInvoiceResponse, OrderStatusHistoryResponse, CursorResponse } from "../types";

export const orderApi = {
    createOrder: (data: OrderRequest) =>
        api.post<OrderResponse>("/v1/order/save", { body: data }),

    getMyOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/my-orders", {
            params: { page, size, sortBy, direction },
        }),

    getMyOrderById: async (orderId: number): Promise<OrderResponse | null> => {
        const data = await api.get<CursorResponse<OrderResponse>>("/v1/order/my-orders", {
            params: { page: 0, size: 100, sortBy: "orderDate", direction: "desc" },
        });
        return data.items.find((o) => o.id === orderId) ?? null;
    },

    getAllOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/all", {
            params: { page, size, sortBy, direction },
        }),

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

    downloadInvoicePdf: async (orderId: number): Promise<Blob> => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085";
        const res = await fetch(`${baseUrl}/v1/order/${orderId}/invoice/pdf`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error("PDF indirilemedi");
        return res.blob();
    },
};
