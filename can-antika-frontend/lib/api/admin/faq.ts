import { api } from "../../api-client";
import type { FaqItem } from "../../types";

export const faqApi = {
    getActive: () =>
        api.get<FaqItem[]>("/v1/faq", { noAuth: true }),

    getAll: () =>
        api.get<FaqItem[]>("/v1/admin/faq"),

    create: (data: { question: string; answer: string; displayOrder?: number; active?: boolean }) =>
        api.post<FaqItem>("/v1/admin/faq", { body: data }),

    update: (id: number, data: { question: string; answer: string; displayOrder?: number; active?: boolean }) =>
        api.put<FaqItem>(`/v1/admin/faq/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<void>(`/v1/admin/faq/${id}`),
};
