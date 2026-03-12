import { api } from "../api-client";
import type { CategoryResponse, CategoryRequest } from "../types";

export const categoryApi = {
    getAll: () =>
        api.get<CategoryResponse[]>("/v1/category/find-all", { noAuth: true }),

    getById: (id: number) =>
        api.get<CategoryResponse>(`/v1/category/${id}`, { noAuth: true }),

    save: (data: CategoryRequest) =>
        api.post<CategoryResponse>("/v1/category/save", { body: data }),

    update: (id: number, data: CategoryRequest) =>
        api.put<CategoryResponse>(`/v1/category/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/category/${id}`),
};
