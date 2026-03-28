import { api } from "../../api-client";
import type { PeriodResponse } from "../../types";

export interface PeriodRequest {
    name: string;
    active?: boolean;
}

const PERIOD_CACHE_TTL_MS = 5 * 60 * 1000;

let periodsCache: { data: PeriodResponse[]; expiresAt: number } | null = null;

function setPeriodsCache(data: PeriodResponse[]) {
    periodsCache = { data, expiresAt: Date.now() + PERIOD_CACHE_TTL_MS };
}

function invalidatePeriodsCache() {
    periodsCache = null;
}

export const periodApi = {
    getAll: async (force = false) => {
        if (!force && periodsCache && periodsCache.expiresAt > Date.now()) {
            return periodsCache.data;
        }
        const periods = await api.get<PeriodResponse[]>("/v1/period/find-all", { noAuth: true, timeoutMs: 8000 });
        setPeriodsCache(periods);
        return periods;
    },

    invalidateCache: () => {
        invalidatePeriodsCache();
    },

    getById: (id: number) =>
        api.get<PeriodResponse>(`/v1/period/${id}`),

    save: async (data: PeriodRequest) => {
        const result = await api.post<PeriodResponse>("/v1/period/save", { body: data });
        invalidatePeriodsCache();
        return result;
    },

    update: async (id: number, data: PeriodRequest) => {
        const result = await api.put<PeriodResponse>(`/v1/period/${id}`, { body: data });
        invalidatePeriodsCache();
        return result;
    },

    delete: async (id: number) => {
        const result = await api.delete<string>(`/v1/period/${id}`);
        invalidatePeriodsCache();
        return result;
    },
};
