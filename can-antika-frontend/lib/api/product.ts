import { api } from "../api-client";
import type { ProductResponse, ProductRequest, CursorResponse } from "../types";

export const productApi = {
    getAll: (page = 0, size = 20, sortBy = "id", direction = "desc") =>
        api.get<CursorResponse<ProductResponse>>("/v1/product", {
            params: { page, size, sortBy, direction },
            noAuth: true,
            timeoutMs: 20000,
        }),

    getById: (id: number, timeoutMs = 10000) =>
        api.get<ProductResponse>(`/v1/product/${id}`, { noAuth: true, timeoutMs }),

    getBySlug: (slug: string, timeoutMs = 10000) =>
        api.get<ProductResponse>(`/v1/product/slug/${encodeURIComponent(slug)}`, { noAuth: true, timeoutMs }),

    search: (params: {
        title?: string;
        categoryId?: number;
        categoryIds?: string;
        periodId?: number;
        periodIds?: string;
        minPrice?: number;
        maxPrice?: number;
        minRating?: number;
        page?: number;
        size?: number;
        sortBy?: string;
        direction?: string;
    }, timeoutMs = 10000) =>
        api.get<CursorResponse<ProductResponse>>("/v1/product/search", {
            params: params as Record<string, string | number>,
            noAuth: true,
            timeoutMs,
        }),

    searchByTitle: (title: string, timeoutMs = 8000) =>
        api.get<ProductResponse[]>("/v1/product/search/title", {
            params: { title },
            noAuth: true,
            timeoutMs,
        }),

    searchByCategory: (categoryId: number, timeoutMs = 8000) =>
        api.get<ProductResponse[]>("/v1/product/search/category", {
            params: { categoryId },
            noAuth: true,
            timeoutMs,
        }),

    findAll: () =>
        api.get<ProductResponse[]>("/v1/product/find-all", { noAuth: true, timeoutMs: 20000 }),

    save: (data: ProductRequest) =>
        api.post<ProductResponse>("/v1/product/save", { body: data }),

    update: (id: number, data: ProductRequest) =>
        api.put<ProductResponse>(`/v1/product/${id}`, { body: data }),

    importFromExcel: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<{ importedCount: number; failedCount: number; errors: string[] }>("/v1/product/import-excel", {
            body: formData,
            timeoutMs: 120000,
        });
    },

    delete: (id: number) =>
        api.delete<string>(`/v1/product/${id}`),

    incrementViewCount: (id: number) =>
        api.post<string>(`/v1/product/${id}/view`, { noAuth: true }),
};
