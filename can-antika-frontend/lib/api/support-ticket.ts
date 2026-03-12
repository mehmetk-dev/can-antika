import { api } from "../api-client";
import type { SupportTicketResponse, SupportTicketRequest, TicketReplyRequest, CursorResponse } from "../types";

export const supportTicketApi = {
    create: (data: SupportTicketRequest) =>
        api.post<SupportTicketResponse>("/v1/support", { body: data }),

    getMyTickets: () =>
        api.get<SupportTicketResponse[]>("/v1/support/my-tickets"),

    getMyTicketById: (ticketId: number) =>
        api.get<SupportTicketResponse>(`/v1/support/my-tickets/${ticketId}`),

    getAllTickets: () =>
        api.get<SupportTicketResponse[]>("/v1/support/all"),

    getAllPaged: (page = 0, size = 10, status?: string) =>
        api.get<CursorResponse<SupportTicketResponse>>("/v1/support/all-paged", {
            params: { page, size, ...(status && { status }) },
        }),

    addReply: (ticketId: number, data: TicketReplyRequest) =>
        api.put<SupportTicketResponse>(`/v1/support/${ticketId}/reply`, { body: data }),

    deleteForAdmin: (ticketId: number) =>
        api.delete<void>(`/v1/support/${ticketId}/admin`),
};
