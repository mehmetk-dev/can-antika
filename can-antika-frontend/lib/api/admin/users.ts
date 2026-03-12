import { api } from "../../api-client";
import type { UserResponse } from "../../types";

export const userApi = {
    getAll: () =>
        api.get<UserResponse[]>("/v1/user/find-all"),

    getById: (id: number) =>
        api.get<UserResponse>(`/v1/user/${id}`),

    delete: (id: number) =>
        api.delete<string>(`/v1/user/${id}`),

    ban: (id: number) =>
        api.put<string>(`/v1/user/${id}/ban`),

    unban: (id: number) =>
        api.put<string>(`/v1/user/${id}/unban`),

    updateRole: (id: number, role: string) =>
        api.put<string>(`/v1/user/${id}/role`, { params: { role } }),
};
