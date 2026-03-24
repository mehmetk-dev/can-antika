// ======================== Enums ========================

export type Role = "ADMIN" | "VENDOR" | "USER";
export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "PAID";
export type PaymentMethod = "CREDIT_CARD" | "EFT" | "CASH_ON_DELIVERY";
export type PaymentStatus = "PENDING" | "PAID" | "UNPAID" | "REFUNDED";

// ======================== Generic Wrappers ========================

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

// ======================== Response DTOs ========================

export interface CategoryResponse {
    id: number;
    name: string;
    description?: string;
    coverImageUrl?: string;
}

export interface PeriodResponse {
    id: number;
    name: string;
    active?: boolean;
}

export interface ProductResponse {
    id: number;
    title: string;
    slug?: string;
    description?: string;
    price: number;
    stock?: number;
    category?: CategoryResponse;
    period?: PeriodResponse;
    imageUrls?: string[];
    attributes?: Record<string, unknown>;
    averageRating?: number;
    reviewCount?: number;
    viewCount?: number;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
    accountNonLocked?: boolean;
    addresses?: AddressResponse[];
    createdAt?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: UserResponse;
}

export interface AddressResponse {
    id: number;
    title: string;
    country: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
}

export interface CartItemResponse {
    id: number;
    product: ProductResponse;
    quantity: number;
    price: number;
    total: number;
}

export interface CartResponse {
    id: number;
    userId: number;
    items: CartItemResponse[];
    updatedAt?: string;
}

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

export interface WishlistItemResponse {
    id: number;
    product: ProductResponse;
    wishlistId: number;
}

export interface WishlistResponse {
    id: number;
    user?: UserResponse;
    items: WishlistItemResponse[];
}

export interface ReviewResponse {
    id: number;
    product?: ProductResponse;
    user?: UserResponse;
    comment: string;
    rating: number;
    createdAt: string;
}

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

export interface OrderReturnResponse {
    id: number;
    orderId: number;
    reason: string;
    status: string;
    createdAt: string;
}

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

// ======================== Request DTOs ========================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: Role;
}

export interface CartItemRequest {
    productId: number;
    quantity: number;
}

export interface OrderRequest {
    addressId: number;
    paymentStatus?: PaymentStatus;
    note?: string;
}

export interface AddressRequest {
    title: string;
    country: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
}

export interface ReviewRequest {
    productId: number;
    userId: number;
    comment: string;
    rating: number;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface ProductRequest {
    title: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: number;
    periodId?: number;
    periodName?: string;
    imageUrls: string[];
    attributes?: Record<string, unknown>;
}

export interface CategoryRequest {
    name: string;
    description?: string;
    coverImageUrl?: string;
}

export interface OrderReturnRequest {
    orderId: number;
    reason: string;
}

export interface SupportTicketRequest {
    subject: string;
    message: string;
}

export interface TicketReplyRequest {
    status: string;
    adminReply: string;
}

export interface TokenRefreshRequest {
    refreshToken: string;
}
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

// ======================== Order Timeline ========================
export interface OrderStatusHistoryResponse {
    id: number;
    oldStatus: string | null;
    newStatus: string;
    changedBy: number | null;
    note: string | null;
    changedAt: string;
}

// ======================== FAQ ========================
export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    displayOrder: number;
    active: boolean;
}

// ======================== Static Pages ========================
export interface StaticPage {
    id: number;
    title: string;
    slug: string;
    content: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// ======================== Blog ========================
export interface BlogPost {
    id: number;
    title: string;
    slug: string;
    summary: string;
    content: string;
    imageUrl: string;
    categoryId: number;
    author: string;
    published: boolean;
    createdAt: string;
}

export interface BlogCategory {
    id: number;
    name: string;
    slug: string;
    active: boolean;
}

// ======================== Contact Request ========================
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

// ======================== Coupon ========================
export interface CouponResponse {
    id: number;
    code: string;
    discount: number;
    minAmount?: number;
    expiryDate: string;
    active: boolean;
}

// ======================== Brand ========================
export interface BrandResponse {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    active: boolean;
}

// ======================== Popup ========================
export interface PopupResponse {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    linkUrl?: string;
    active: boolean;
    startDate?: string;
    endDate?: string;
}

// ======================== Activity Log ========================
export interface ActivityLogResponse {
    id: number;
    type: string;
    userId: number;
    description: string;
    createdAt: string;
}

// ======================== Bank Transfer ========================
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

// ======================== Report Types ========================
export interface SalesByCategoryReport {
    categoryName: string;
    totalSold: number;
    totalRevenue: number;
}

export interface StockReport {
    productId: number;
    title: string;
    stock: number;
    imageUrl?: string;
}

export interface NewsletterSubscriber {
    id: number;
    email: string;
    name?: string;
    subscribedAt: string;
}
