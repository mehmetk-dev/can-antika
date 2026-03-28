import { api } from "../api-client";
import type { PaymentResponse, PaymentMethod } from "../types";

function buildIdempotencyKey(orderId: number, paymentMethod: PaymentMethod, providedKey?: string): string {
    if (providedKey && providedKey.trim().length > 0) {
        return providedKey.trim();
    }

    const randomPart =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return `pay-${orderId}-${paymentMethod}-${randomPart}`;
}

export const paymentApi = {
    processPayment: (orderId: number, amount: number, paymentMethod: PaymentMethod, idempotencyKey?: string) =>
        api.post<PaymentResponse>("/v1/payment/process", {
            params: { orderId, amount, paymentMethod },
            headers: {
                "Idempotency-Key": buildIdempotencyKey(orderId, paymentMethod, idempotencyKey),
            },
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
