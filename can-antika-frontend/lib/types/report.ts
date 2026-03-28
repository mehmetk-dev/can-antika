export interface SalesByCategoryReport {
    categoryId: number;
    categoryName: string;
    totalSold: number;
    totalRevenue: number;
}

export interface StockReport {
    productId: number;
    productTitle: string;
    title: string;
    categoryName: string;
    stock: number;
    price: number;
    imageUrl?: string;
}

export interface RevenueReport {
    period: string;
    revenue: number;
    orderCount: number;
    avgOrderValue: number;
}

export interface CustomerReport {
    userId: number;
    userName: string;
    userEmail: string;
    totalOrders: number;
    totalSpent: number;
    registeredAt?: string;
}
