export interface SupportTicketResponse {
    id: number;
    userId: number;
    userEmail?: string;
    userName?: string;
    subject: string;
    message: string;
    status: string;
    adminReplies?: string[];
    createdAt: string;
}

export interface SupportTicketRequest {
    subject: string;
    message: string;
}

export interface TicketReplyRequest {
    status: string;
    adminReply: string;
}

export interface ContactRequestResponse {
    id: number;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    read: boolean;
    adminNote?: string;
    createdAt: string;
}
