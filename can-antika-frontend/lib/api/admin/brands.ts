import { api } from "../../api-client";
import type { BrandResponse } from "../../types";

export const brandApi = {
    getActive: () => api.get<BrandResponse[]>("/v1/brands", { noAuth: true }),
    getAll: () => api.get<BrandResponse[]>("/v1/admin/brands"),
    create: (data: Partial<BrandResponse>) => api.post<BrandResponse>("/v1/admin/brands", { body: data }),
    update: (id: number, data: Partial<BrandResponse>) => api.put<BrandResponse>(`/v1/admin/brands/${id}`, { body: data }),
    delete: (id: number) => api.delete<void>(`/v1/admin/brands/${id}`),
};
