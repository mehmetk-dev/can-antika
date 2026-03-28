import type { PaymentMethod, PaymentStatus } from "./common";
import type { UserResponse } from "./user";
import type { OrderResponse } from "./order";

export interface PaymentResponse {
    id: number;
    user?: UserResponse;
    order?: OrderResponse;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionId?: string;
    createdAt: string;
}

export interface BankTransferResponse {
    id: number;
    orderId: number;
    senderName: string;
    senderIban?: string;
    amount: number;
    referenceNote?: string;
    status: string;
    adminNote?: string;
    createdAt: string;
}

export interface CouponResponse {
    id: number;
    code: string;
    discount: number;
    minAmount?: number;
    expiryDate: string;
    active: boolean;
}
