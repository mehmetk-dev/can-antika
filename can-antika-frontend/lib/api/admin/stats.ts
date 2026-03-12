import { api } from "../../api-client";
import type { StatsResponse } from "../../types";

export const statsApi = {
    getStats: (days = 30) =>
        api.get<StatsResponse>(`/v1/admin/stats?days=${days}`),
};
