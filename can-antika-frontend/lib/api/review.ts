import { api } from "../api-client";
import type { ReviewResponse, ReviewRequest, CursorResponse } from "../types";

export const reviewApi = {
    getAll: () =>
        api.get<ReviewResponse[]>("/v1/review/find-all", { noAuth: true }),

    getById: (id: number) =>
        api.get<ReviewResponse>(`/v1/review/${id}`, { noAuth: true }),

    save: (data: ReviewRequest) =>
        api.post<ReviewResponse>("/v1/review/save", { body: data }),

    getByProductId: (productId: number) =>
        api.get<ReviewResponse[]>(`/v1/review/product/${productId}`, { noAuth: true }),

    update: (id: number, data: ReviewRequest) =>
        api.put<ReviewResponse>(`/v1/review/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/review/${id}`),
};

export const reviewAdminApi = {
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ReviewResponse>>("/v1/review/admin/all", { params: { page, size } }),
};
