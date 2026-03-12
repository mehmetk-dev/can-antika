import { api } from "../api-client";
import type { PaymentResponse, PaymentMethod } from "../types";

export const paymentApi = {
    processPayment: (orderId: number, amount: number, paymentMethod: PaymentMethod) =>
        api.post<PaymentResponse>("/v1/payment/process", {
            params: { orderId, amount, paymentMethod },
        }),

    getById: (paymentId: number) =>
        api.get<PaymentResponse>(`/v1/payment/${paymentId}`),

    getMyPayments: () =>
        api.get<PaymentResponse[]>("/v1/payment/my-payments"),

    updateStatus: (paymentId: number, newStatus: string) =>
        api.put<PaymentResponse>(`/v1/payment/${paymentId}/status`, {
            params: { newStatus },
        }),

    delete: (paymentId: number) =>
        api.delete<string>(`/v1/payment/${paymentId}`),
};
