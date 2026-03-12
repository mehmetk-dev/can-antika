import { api } from "../../api-client";
import type { CursorResponse, NewsletterSubscriber } from "../../types";

export const newsletterApi = {
    subscribe: (email: string, name?: string) =>
        api.post<{ message: string }>("/v1/newsletter/subscribe", {
            body: { email, name },
            noAuth: true,
        }),

    unsubscribe: (email: string) =>
        api.post<{ message: string }>("/v1/newsletter/unsubscribe", {
            body: { email },
            noAuth: true,
        }),

    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<NewsletterSubscriber>>("/v1/newsletter/admin", {
            params: { page, size },
        }),

    getCount: () =>
        api.get<{ count: number }>("/v1/newsletter/admin/count"),

    delete: (id: number) =>
        api.delete<{ message: string }>(`/v1/newsletter/admin/${id}`),
};
