import { api } from "../../api-client";
import type { NotificationResponse } from "../../types";

export const notificationApi = {
    getAll: () =>
        api.get<NotificationResponse[]>("/v1/notifications"),

    getUnreadCount: () =>
        api.get<{ count: number }>("/v1/notifications/unread-count"),

    markAsRead: (id: number) =>
        api.put<string>(`/v1/notifications/${id}/read`),

    markAllAsRead: () =>
        api.put<string>("/v1/notifications/read-all"),
};
