export type BadgeVariant = "default" | "secondary" | "outline";

export interface OrderStatusConfig {
    label: string;
    variant: BadgeVariant;
    className: string;
}

export const orderStatusConfig: Record<string, OrderStatusConfig> = {
    PENDING: { label: "Hazırlanıyor", variant: "outline", className: "bg-amber-100 text-amber-800" },
    PAID: { label: "Ödendi", variant: "default", className: "bg-emerald-100 text-emerald-800" },
    SHIPPED: { label: "Kargoda", variant: "secondary", className: "bg-blue-100 text-blue-800" },
    DELIVERED: { label: "Teslim Edildi", variant: "default", className: "bg-green-100 text-green-800" },
    CANCELLED: { label: "İptal Edildi", variant: "outline", className: "bg-red-100 text-red-800" },
};

export interface ReturnStatusConfig {
    label: string;
    variant: BadgeVariant;
    className: string;
}

export const returnStatusConfig: Record<string, ReturnStatusConfig> = {
    PENDING: { label: "Beklemede", variant: "secondary", className: "bg-amber-100 text-amber-800" },
    APPROVED: { label: "Onaylandı", variant: "default", className: "bg-green-100 text-green-800" },
    REJECTED: { label: "Reddedildi", variant: "secondary", className: "bg-red-100 text-red-800" },
};

export function getOrderStatus(status: string): OrderStatusConfig {
    return orderStatusConfig[status] ?? { label: status, variant: "outline", className: "" };
}

export function getReturnStatus(status: string): ReturnStatusConfig {
    return returnStatusConfig[status] ?? { label: status, variant: "outline", className: "" };
}
