export interface StatsResponse {
    totalRevenue: number;
    totalOrders: number;
    lowStockProducts: number;
    totalProducts: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    pendingOrders: number;
    activeProducts: number;
    dailyStats: DailyStats[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    orderStatusBreakdown: OrderStatusBreakdown[];
    monthlyTrends: MonthlyTrend[];
    recentActivities: RecentActivity[];
}

export interface DailyStats {
    date: string;
    revenue: number;
    orderCount: number;
}

export interface TopProduct {
    id: number;
    title: string;
    imageUrl?: string;
    totalSold: number;
    totalRevenue: number;
}

export interface TopCustomer {
    id: number;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
}

export interface OrderStatusBreakdown {
    status: string;
    label: string;
    count: number;
}

export interface MonthlyTrend {
    month: string;
    revenue: number;
    orderCount: number;
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: string;
}

export interface ActivityLogResponse {
    id: number;
    type: string;
    userId: number;
    description: string;
    createdAt: string;
}

export interface SiteSettingsResponse {
    id?: number;
    storeName: string;
    businessType: string;
    storeDescription: string;
    companyName: string;
    taxId: string;
    taxOffice: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    whatsapp: string;
    weekdayHours: string;
    saturdayHours: string;
    standardDelivery: string;
    expressDelivery: string;
    freeShippingMin: number;
    shippingDurationDays: number;
    expressShippingFee: number;
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    googleAnalyticsId: string;
    facebookPixelId: string;
    customHeadScripts: string;
    footerAbout: string;
    footerCopyright: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpFromEmail: string;
    smtpFromName: string;
    currency: string;
    currencySymbol: string;
    smsProvider: string;
    smsApiKey: string;
    smsApiSecret: string;
    smsSenderName: string;
    smsEnabled: boolean;
    paymentProvider: string;
    paymentApiKey: string;
    paymentSecretKey: string;
    paymentMerchantId: string;
    paymentTestMode: boolean;
    creditCardEnabled: boolean;
    bankTransferEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
}
