export interface NotificationResponse {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: string;
    referenceId?: number;
    read: boolean;
    createdAt: string;
}
