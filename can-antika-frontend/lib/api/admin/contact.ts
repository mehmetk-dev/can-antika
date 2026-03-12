import { api } from "../../api-client";
import type { ContactRequestResponse, CursorResponse } from "../../types";

export const contactApi = {
    submit: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
        api.post<ContactRequestResponse>("/v1/contact", { body: data, noAuth: true }),
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ContactRequestResponse>>("/v1/admin/contact-requests", { params: { page, size } }),
    getUnreadCount: () =>
        api.get<{ count: number }>("/v1/admin/contact-requests/unread-count"),
    update: (id: number, data: Partial<ContactRequestResponse>) =>
        api.put<ContactRequestResponse>(`/v1/admin/contact-requests/${id}`, { body: data }),
    delete: (id: number) =>
        api.delete<void>(`/v1/admin/contact-requests/${id}`),
};
