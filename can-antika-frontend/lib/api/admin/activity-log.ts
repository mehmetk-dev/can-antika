import { api } from "../../api-client";
import type { CursorResponse, ActivityLogResponse } from "../../types";

export const activityLogApi = {
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ActivityLogResponse>>("/v1/admin/activity-logs", {
            params: { page, size },
        }),

    getByAdmin: (adminId: number, page = 0, size = 20) =>
        api.get<CursorResponse<ActivityLogResponse>>(`/v1/admin/activity-logs/by-admin/${adminId}`, {
            params: { page, size },
        }),
};
