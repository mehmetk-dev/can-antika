import { api } from "../../api-client";
import type { PeriodResponse } from "../../types";

export interface PeriodRequest {
    name: string;
    active?: boolean;
}

export const periodApi = {
    getAll: () =>
        api.get<PeriodResponse[]>("/v1/period/find-all", { noAuth: true, timeoutMs: 8000 }),

    getById: (id: number) =>
        api.get<PeriodResponse>(`/v1/period/${id}`),

    save: (data: PeriodRequest) =>
        api.post<PeriodResponse>("/v1/period/save", { body: data }),

    update: (id: number, data: PeriodRequest) =>
        api.put<PeriodResponse>(`/v1/period/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/period/${id}`),
};
