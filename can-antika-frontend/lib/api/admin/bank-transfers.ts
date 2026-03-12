import { api } from "../../api-client";
import type { BankTransferResponse, CursorResponse } from "../../types";

export const bankTransferApi = {
    submit: (data: Partial<BankTransferResponse>) => api.post<BankTransferResponse>("/v1/bank-transfers", { body: data }),
    getAll: (page = 0, size = 20, status?: string) =>
        api.get<CursorResponse<BankTransferResponse>>("/v1/admin/bank-transfers", { params: { page, size, status } }),
    getPendingCount: () =>
        api.get<{ count: number }>("/v1/admin/bank-transfers/pending-count"),
    update: (id: number, data: Partial<BankTransferResponse>) =>
        api.put<BankTransferResponse>(`/v1/admin/bank-transfers/${id}`, { body: data }),
};
