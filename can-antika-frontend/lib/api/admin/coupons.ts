import { api } from "../../api-client";
import type { CouponResponse } from "../../types";

export const couponApi = {
    getAll: () =>
        api.get<CouponResponse[]>("/v1/coupons/admin/all"),

    getByCode: (code: string) =>
        api.get<CouponResponse>(`/v1/coupons/${code}`),

    create: (code: string, discount: number, minAmount?: number, days = 30) =>
        api.post<CouponResponse>("/v1/coupons/create", {
            params: { code, discount, ...(minAmount && { minAmount }), days },
        }),

    update: (id: number, data: Partial<CouponResponse>) =>
        api.put<CouponResponse>(`/v1/coupons/admin/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/coupons/${id}`),
};
