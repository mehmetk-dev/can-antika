import { api } from "../api-client";
import type { OrderReturnResponse, OrderReturnRequest } from "../types";

export const orderReturnApi = {
    createReturn: (data: OrderReturnRequest) =>
        api.post<OrderReturnResponse>("/v1/order/return", { body: data }),

    getMyReturns: () =>
        api.get<OrderReturnResponse[]>("/v1/order/return/my-returns"),

    getAllReturns: () =>
        api.get<OrderReturnResponse[]>("/v1/order/return/all"),

    approve: (returnId: number) =>
        api.put<OrderReturnResponse>(`/v1/order/return/${returnId}/approve`),

    reject: (returnId: number) =>
        api.put<OrderReturnResponse>(`/v1/order/return/${returnId}/reject`),
};
