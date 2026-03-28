import type { OrderStatus, PaymentStatus } from "./common";
import type { AddressResponse } from "./address";
import type { ProductResponse } from "./product";
import type { UserResponse } from "./user";

export interface OrderItemResponse {
    id: number;
    product?: ProductResponse;
    title: string;
    quantity: number;
    price: number;
}

export interface OrderResponse {
    id: number;
    user?: UserResponse;
    orderDate: string;
    orderStatus: OrderStatus;
    orderItems: OrderItemResponse[];
    shippingAddress?: AddressResponse;
    totalAmount: number;
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    carrierName?: string;
}

export interface OrderRequest {
    addressId: number;
    paymentStatus?: PaymentStatus;
    note?: string;
}

export interface OrderReturnResponse {
    id: number;
    orderId: number;
    reason: string;
    status: string;
    createdAt: string;
}

export interface OrderReturnRequest {
    orderId: number;
    reason: string;
}

export interface OrderInvoiceResponse {
    invoiceNumber: string;
    orderId: number;
    orderDate: string;
    customerName: string;
    shippingAddressSummary: string;
    items: InvoiceItemLine[];
    subtotal: number;
    totalAmount: number;
    orderStatus: string;
}

export interface InvoiceItemLine {
    productTitle: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface OrderStatusHistoryResponse {
    id: number;
    oldStatus: string | null;
    newStatus: string;
    changedBy: number | null;
    note: string | null;
    changedAt: string;
}
