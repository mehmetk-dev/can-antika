export type Role = "ADMIN" | "VENDOR" | "USER";
export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "PAID";
export type PaymentMethod = "CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY";
export type PaymentStatus = "PENDING" | "PAID" | "UNPAID" | "REFUNDED";

export interface ResultData<T> {
    status: boolean;
    message: string;
    code: string;
    data: T;
}

export interface CursorResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalElement: number;
    items: T[];
}
