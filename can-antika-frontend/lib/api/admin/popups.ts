import { api } from "../../api-client";
import type { PopupResponse } from "../../types";

export const popupApi = {
    getActive: () => api.get<PopupResponse[]>("/v1/popups/active", { noAuth: true }),
    getAll: () => api.get<PopupResponse[]>("/v1/admin/popups"),
    create: (data: Partial<PopupResponse>) => api.post<PopupResponse>("/v1/admin/popups", { body: data }),
    update: (id: number, data: Partial<PopupResponse>) => api.put<PopupResponse>(`/v1/admin/popups/${id}`, { body: data }),
    delete: (id: number) => api.delete<void>(`/v1/admin/popups/${id}`),
};
