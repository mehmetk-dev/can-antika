import { api } from "../../api-client";
import type { CategoryResponse, CategoryRequest } from "../../types";

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

let categoriesCache: { data: CategoryResponse[]; expiresAt: number } | null = null;

function setCategoriesCache(data: CategoryResponse[]) {
    categoriesCache = {
        data,
        expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
    };
}

function invalidateCategoriesCache() {
    categoriesCache = null;
}

export const categoryApi = {
    getAll: () =>
        api.get<CategoryResponse[]>("/v1/category/find-all", { noAuth: true, timeoutMs: 20000 }),

    getAllCached: async (force = false) => {
        if (!force && categoriesCache && categoriesCache.expiresAt > Date.now()) {
            return categoriesCache.data;
        }

        const categories = await api.get<CategoryResponse[]>("/v1/category/find-all", { noAuth: true, timeoutMs: 20000 });
        setCategoriesCache(categories);
        return categories;
    },

    invalidateCache: () => {
        invalidateCategoriesCache();
    },

    getById: (id: number) =>
        api.get<CategoryResponse>(`/v1/category/${id}`, { noAuth: true }),

    getProductCounts: (noAuth = false) =>
        api.get<Record<string, number>>("/v1/category/product-counts", { noAuth }),

    save: async (data: CategoryRequest) => {
        const result = await api.post<CategoryResponse>("/v1/category/save", { body: data });
        invalidateCategoriesCache();
        return result;
    },

    update: async (id: number, data: CategoryRequest) => {
        const result = await api.put<CategoryResponse>(`/v1/category/${id}`, { body: data });
        invalidateCategoriesCache();
        return result;
    },

    delete: async (id: number) => {
        const result = await api.delete<string>(`/v1/category/${id}`);
        invalidateCategoriesCache();
        return result;
    },
};
