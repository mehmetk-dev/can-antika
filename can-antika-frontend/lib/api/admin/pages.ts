import { api } from "../../api-client";
import type { StaticPage } from "../../types";

export const staticPageApi = {
    getBySlug: (slug: string) =>
        api.get<StaticPage>(`/v1/pages/${slug}`, { noAuth: true }),

    getActivePages: () =>
        api.get<StaticPage[]>("/v1/pages", { noAuth: true }),

    getAll: () =>
        api.get<StaticPage[]>("/v1/admin/pages"),

    create: (data: { title: string; slug?: string; content: string; active?: boolean }) =>
        api.post<StaticPage>("/v1/admin/pages", { body: data }),

    update: (id: number, data: { title: string; slug?: string; content: string; active?: boolean }) =>
        api.put<StaticPage>(`/v1/admin/pages/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<void>(`/v1/admin/pages/${id}`),
};
