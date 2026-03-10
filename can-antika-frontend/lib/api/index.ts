import { api } from "../api-client";
import type {
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
    ProductResponse,
    ProductRequest,
    CursorResponse,
    CategoryResponse,
    CategoryRequest,
    CartResponse,
    CartItemRequest,
    OrderResponse,
    OrderRequest,
    OrderInvoiceResponse,
    WishlistResponse,
    AddressResponse,
    AddressRequest,
    ReviewResponse,
    ReviewRequest,
    PaymentResponse,
    PaymentMethod,
    StatsResponse,
    UserResponse,
    OrderReturnResponse,
    OrderReturnRequest,
    SupportTicketResponse,
    SupportTicketRequest,
    TicketReplyRequest,
    SiteSettingsResponse,
    NotificationResponse,
    FaqItem,
    StaticPage,
    BlogPost,
    BlogCategory,
    ContactRequestResponse,
    CouponResponse,
    BrandResponse,
    PopupResponse,
    ActivityLogResponse,
    BankTransferResponse,
    SalesByCategoryReport,
    StockReport,
    NewsletterSubscriber,
    OrderStatusHistoryResponse,
} from "../types";

// ======================== Auth ========================

export const authApi = {
    login: (data: LoginRequest) =>
        api.post<UserResponse>("/v1/auth/login", { body: data, noAuth: true }),

    register: (data: RegisterRequest) =>
        api.post<Record<string, string>>("/v1/auth/register", { body: data, noAuth: true }),

    refreshToken: () =>
        api.post<UserResponse>("/v1/auth/refresh-token", { noAuth: true }),

    forgotPassword: (email: string) =>
        api.post<string>("/v1/auth/forgot-password", { params: { email }, noAuth: true }),

    resetPassword: (data: { token: string; newPassword: string }) =>
        api.post<string>("/v1/auth/reset-password", { body: data, noAuth: true }),

    changePassword: (data: ChangePasswordRequest) =>
        api.post<string>("/v1/auth/change-password", { body: data }),

    updateProfile: (data: { name: string }) =>
        api.put<UserResponse>("/v1/auth/profile", { body: data }),

    getProfile: () =>
        api.get<UserResponse>("/v1/auth/me", { noAuth: true }),

    logout: () =>
        api.post<string>("/v1/auth/logout"),

    deactivateMyAccount: () =>
        api.delete<string>("/v1/user/me"),
};

// ======================== Product ========================

export const productApi = {
    getAll: (page = 0, size = 20, sortBy = "id", direction = "asc") =>
        api.get<CursorResponse<ProductResponse>>("/v1/product", {
            params: { page, size, sortBy, direction },
            noAuth: true,
        }),

    getById: (id: number) =>
        api.get<ProductResponse>(`/v1/product/${id}`, { noAuth: true }),

    search: (params: {
        title?: string;
        categoryId?: number;
        minPrice?: number;
        maxPrice?: number;
        minRating?: number;
        page?: number;
        size?: number;
        sortBy?: string;
        direction?: string;
    }) =>
        api.get<CursorResponse<ProductResponse>>("/v1/product/search", {
            params: params as Record<string, string | number>,
            noAuth: true,
        }),

    searchByTitle: (title: string) =>
        api.get<ProductResponse[]>("/v1/product/search/title", {
            params: { title },
            noAuth: true,
        }),

    searchByCategory: (categoryId: number) =>
        api.get<ProductResponse[]>("/v1/product/search/category", {
            params: { categoryId },
            noAuth: true,
        }),

    findAll: () =>
        api.get<ProductResponse[]>("/v1/product/find-all", { noAuth: true }),

    save: (data: ProductRequest) =>
        api.post<ProductResponse>("/v1/product/save", { body: data }),

    update: (id: number, data: ProductRequest) =>
        api.put<ProductResponse>(`/v1/product/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/product/${id}`),

    incrementViewCount: (id: number) =>
        api.post<string>(`/v1/product/${id}/view`, { noAuth: true }),
};

// ======================== Category ========================

export const categoryApi = {
    getAll: () =>
        api.get<CategoryResponse[]>("/v1/category/find-all", { noAuth: true }),

    getById: (id: number) =>
        api.get<CategoryResponse>(`/v1/category/${id}`, { noAuth: true }),

    save: (data: CategoryRequest) =>
        api.post<CategoryResponse>("/v1/category/save", { body: data }),

    update: (id: number, data: CategoryRequest) =>
        api.put<CategoryResponse>(`/v1/category/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/category/${id}`),
};

// ======================== Cart ========================

export const cartApi = {
    getCart: () =>
        api.get<CartResponse>("/v1/cart"),

    addItem: async (data: CartItemRequest) => {
        const res = await api.post<CartResponse>("/v1/cart/items", { body: data });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        return res;
    },

    syncCart: async (items: CartItemRequest[]) => {
        const res = await api.post<CartResponse>("/v1/cart/sync", { body: items });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        return res;
    },

    updateQuantity: async (productId: number, quantity: number) => {
        const res = await api.put<CartResponse>(`/v1/cart/items/${productId}`, { params: { quantity } });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        return res;
    },

    removeItem: async (productId: number) => {
        const res = await api.delete<CartResponse>(`/v1/cart/items/${productId}`);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        return res;
    },

    clearCart: async () => {
        const res = await api.delete<string>("/v1/cart");
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        return res;
    },

    getTotal: () =>
        api.get<number>("/v1/cart/total"),

    applyCoupon: (code: string) =>
        api.post<CartResponse>(`/v1/cart/coupon/${code}`),

    removeCoupon: () =>
        api.delete<CartResponse>("/v1/cart/coupon"),
};

// ======================== Order ========================

export const orderApi = {
    createOrder: (data: OrderRequest) =>
        api.post<OrderResponse>("/v1/order/save", { body: data }),

    getMyOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/my-orders", {
            params: { page, size, sortBy, direction },
        }),

    getMyOrderById: async (orderId: number): Promise<OrderResponse | null> => {
        // Tek sipariş çek — my-orders filtresi ile 1 adet
        const data = await api.get<CursorResponse<OrderResponse>>("/v1/order/my-orders", {
            params: { page: 0, size: 100, sortBy: "orderDate", direction: "desc" },
        });
        return data.items.find((o) => o.id === orderId) ?? null;
    },

    getAllOrders: (page = 0, size = 20, sortBy = "orderDate", direction = "desc") =>
        api.get<CursorResponse<OrderResponse>>("/v1/order/all", {
            params: { page, size, sortBy, direction },
        }),

    getInvoice: (orderId: number) =>
        api.get<OrderInvoiceResponse>(`/v1/order/${orderId}/invoice`),

    updateTracking: (orderId: number, trackingNumber: string, carrierName: string) =>
        api.put<OrderResponse>(`/v1/order/${orderId}/tracking`, {
            params: { trackingNumber, carrierName },
        }),

    cancelOrder: (orderId: number) =>
        api.post<OrderResponse>(`/v1/order/${orderId}/cancel`),

    updateOrderStatus: (orderId: number, status: string) =>
        api.put<OrderResponse>(`/v1/order/${orderId}/status`, {
            params: { status },
        }),

    getTimeline: (orderId: number) =>
        api.get<OrderStatusHistoryResponse[]>(`/v1/order/${orderId}/timeline`),

    downloadInvoicePdf: async (orderId: number): Promise<Blob> => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085";
        const res = await fetch(`${baseUrl}/v1/order/${orderId}/invoice/pdf`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error("PDF indirilemedi");
        return res.blob();
    },
};

// ======================== Wishlist ========================

export const wishlistApi = {
    getWishlist: () =>
        api.get<WishlistResponse>("/v1/wishlist"),

    addItem: async (productId: number) => {
        const res = await api.post<WishlistResponse>(`/v1/wishlist/add/${productId}`);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("wishlist-updated"));
        return res;
    },

    removeItem: async (productId: number) => {
        const res = await api.delete<string>(`/v1/wishlist/remove/${productId}`);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("wishlist-updated"));
        return res;
    },

    clearWishlist: async () => {
        const res = await api.delete<string>("/v1/wishlist/clear");
        if (typeof window !== "undefined") window.dispatchEvent(new Event("wishlist-updated"));
        return res;
    },
};

// ======================== Address ========================

export const addressApi = {
    getMyAddresses: () =>
        api.get<AddressResponse[]>("/v1/address/my-addresses"),

    getById: (id: number) =>
        api.get<AddressResponse>(`/v1/address/${id}`),

    save: (data: AddressRequest) =>
        api.post<AddressResponse>("/v1/address/save", { body: data }),

    update: (id: number, data: AddressRequest) =>
        api.put<AddressResponse>(`/v1/address/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/address/${id}`),

    findAll: () =>
        api.get<AddressResponse[]>("/v1/address/find-all"),
};

// ======================== Review ========================

export const reviewApi = {
    getAll: () =>
        api.get<ReviewResponse[]>("/v1/review/find-all", { noAuth: true }),

    getById: (id: number) =>
        api.get<ReviewResponse>(`/v1/review/${id}`, { noAuth: true }),

    save: (data: ReviewRequest) =>
        api.post<ReviewResponse>("/v1/review/save", { body: data }),

    getByProductId: (productId: number) =>
        api.get<ReviewResponse[]>(`/v1/review/product/${productId}`, { noAuth: true }),

    update: (id: number, data: ReviewRequest) =>
        api.put<ReviewResponse>(`/v1/review/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/review/${id}`),
};

// ======================== Payment ========================

export const paymentApi = {
    processPayment: (orderId: number, amount: number, paymentMethod: PaymentMethod) =>
        api.post<PaymentResponse>("/v1/payment/process", {
            params: { orderId, amount, paymentMethod },
        }),

    getById: (paymentId: number) =>
        api.get<PaymentResponse>(`/v1/payment/${paymentId}`),

    getMyPayments: () =>
        api.get<PaymentResponse[]>("/v1/payment/my-payments"),

    updateStatus: (paymentId: number, newStatus: string) =>
        api.put<PaymentResponse>(`/v1/payment/${paymentId}/status`, {
            params: { newStatus },
        }),

    delete: (paymentId: number) =>
        api.delete<string>(`/v1/payment/${paymentId}`),
};

// ======================== Order Return ========================

export const orderReturnApi = {
    createReturn: (data: OrderReturnRequest) =>
        api.post<OrderReturnResponse>("/v1/order/return", { body: data }),

    getMyReturns: () =>
        api.get<OrderReturnResponse[]>("/v1/order/return/my-returns"),

    getAllReturns: () =>
        api.get<OrderReturnResponse[]>("/v1/order/return/all"),

    approve: (returnId: number) =>
        api.put<OrderReturnResponse>(`/v1/order/return/${returnId}/approve`),

    reject: (returnId: number) =>
        api.put<OrderReturnResponse>(`/v1/order/return/${returnId}/reject`),
};

// ======================== Support Ticket ========================

export const supportTicketApi = {
    create: (data: SupportTicketRequest) =>
        api.post<SupportTicketResponse>("/v1/support", { body: data }),

    getMyTickets: () =>
        api.get<SupportTicketResponse[]>("/v1/support/my-tickets"),

    getMyTicketById: (ticketId: number) =>
        api.get<SupportTicketResponse>(`/v1/support/my-tickets/${ticketId}`),

    getAllTickets: () =>
        api.get<SupportTicketResponse[]>("/v1/support/all"),

    getAllPaged: (page = 0, size = 10, status?: string) =>
        api.get<CursorResponse<SupportTicketResponse>>("/v1/support/all-paged", {
            params: { page, size, ...(status && { status }) },
        }),

    addReply: (ticketId: number, data: TicketReplyRequest) =>
        api.put<SupportTicketResponse>(`/v1/support/${ticketId}/reply`, { body: data }),

    deleteForAdmin: (ticketId: number) =>
        api.delete<void>(`/v1/support/${ticketId}/admin`),
};

// ======================== Stats (Admin) ========================

export const statsApi = {
    getStats: (days = 30) =>
        api.get<StatsResponse>(`/v1/admin/stats?days=${days}`),
};

// ======================== User (Admin) ========================

export const userApi = {
    getAll: () =>
        api.get<UserResponse[]>("/v1/user/find-all"),

    getById: (id: number) =>
        api.get<UserResponse>(`/v1/user/${id}`),

    delete: (id: number) =>
        api.delete<string>(`/v1/user/${id}`),

    ban: (id: number) =>
        api.put<string>(`/v1/user/${id}/ban`),

    unban: (id: number) =>
        api.put<string>(`/v1/user/${id}/unban`),

    updateRole: (id: number, role: string) =>
        api.put<string>(`/v1/user/${id}/role`, { params: { role } }),
};

// ======================== File Upload ========================

export const fileApi = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<string>("/v1/files/upload", { body: formData });
    },

    uploadMultiple: (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        return api.post<string[]>("/v1/files/upload-multiple", { body: formData });
    },
};

// ======================== Site Settings ========================

export const siteSettingsApi = {
    get: () =>
        api.get<SiteSettingsResponse>("/v1/site-settings", { noAuth: true }),

    /** Admin endpoint — SMTP, ödeme, SMS gibi hassas alanlar dahil */
    getAdmin: () =>
        api.get<SiteSettingsResponse>("/v1/site-settings/admin"),

    update: (data: SiteSettingsResponse) =>
        api.put<SiteSettingsResponse>("/v1/site-settings", { body: data }),
};

// ======================== Notifications ========================

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

// ======================== Activity Logs (Admin) ========================

export const activityLogApi = {
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ActivityLogResponse>>("/v1/admin/activity-logs", {
            params: { page, size },
        }),

    getByAdmin: (adminId: number, page = 0, size = 20) =>
        api.get<CursorResponse<ActivityLogResponse>>(`/v1/admin/activity-logs/by-admin/${adminId}`, {
            params: { page, size },
        }),
};

// ======================== Newsletter (Admin) ========================

export const newsletterApi = {
    subscribe: (email: string, name?: string) =>
        api.post<{ message: string }>("/v1/newsletter/subscribe", {
            body: { email, name },
            noAuth: true,
        }),

    unsubscribe: (email: string) =>
        api.post<{ message: string }>("/v1/newsletter/unsubscribe", {
            body: { email },
            noAuth: true,
        }),

    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<NewsletterSubscriber>>("/v1/newsletter/admin", {
            params: { page, size },
        }),

    getCount: () =>
        api.get<{ count: number }>("/v1/newsletter/admin/count"),

    delete: (id: number) =>
        api.delete<{ message: string }>(`/v1/newsletter/admin/${id}`),
};

// ======================== FAQ (Admin) ========================

export const faqApi = {
    getActive: () =>
        api.get<FaqItem[]>("/v1/faq", { noAuth: true }),

    getAll: () =>
        api.get<FaqItem[]>("/v1/admin/faq"),

    create: (data: { question: string; answer: string; sortOrder?: number; active?: boolean }) =>
        api.post<FaqItem>("/v1/admin/faq", { body: data }),

    update: (id: number, data: { question: string; answer: string; sortOrder?: number; active?: boolean }) =>
        api.put<FaqItem>(`/v1/admin/faq/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<void>(`/v1/admin/faq/${id}`),
};

// ======================== Static Pages (Admin) ========================

export const staticPageApi = {
    getBySlug: (slug: string) =>
        api.get<StaticPage>(`/v1/pages/${slug}`, { noAuth: true }),

    getActivePages: () =>
        api.get<StaticPage[]>("/v1/pages", { noAuth: true }),

    getAll: () =>
        api.get<StaticPage[]>("/v1/admin/pages"),

    create: (data: { title: string; slug?: string; content: string; active?: boolean }) =>
        api.post<StaticPage>("/v1/admin/pages", { body: data }),

    update: (id: number, data: { title: string; slug?: string; content: string; active?: boolean }) =>
        api.put<StaticPage>(`/v1/admin/pages/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<void>(`/v1/admin/pages/${id}`),
};

// ======================== Reports (Admin) ========================

export const reportApi = {
    salesByCategory: () =>
        api.get<SalesByCategoryReport[]>("/v1/admin/reports/sales-by-category"),

    stockReport: (threshold = 10) =>
        api.get<StockReport[]>("/v1/admin/reports/stock", {
            params: { threshold },
        }),

    customerReport: () =>
        api.get<Record<string, unknown>[]>("/v1/admin/reports/customers"),

    revenueReport: (months = 12) =>
        api.get<Record<string, unknown>[]>("/v1/admin/reports/revenue", {
            params: { months },
        }),

    abandonedCarts: (page = 0, size = 20, hoursThreshold = 24) =>
        api.get<CursorResponse<Record<string, unknown>>>("/v1/admin/reports/abandoned-carts", {
            params: { page, size, hoursThreshold },
        }),
};

// ======================== Coupons (Admin) ========================

export const couponApi = {
    getAll: () =>
        api.get<CouponResponse[]>("/v1/coupons/admin/all"),

    getByCode: (code: string) =>
        api.get<CouponResponse>(`/v1/coupons/${code}`),

    create: (code: string, discount: number, minAmount?: number, days = 30) =>
        api.post<CouponResponse>("/v1/coupons/create", {
            params: { code, discount, ...(minAmount && { minAmount }), days },
        }),

    update: (id: number, data: Partial<CouponResponse>) =>
        api.put<CouponResponse>(`/v1/coupons/admin/${id}`, { body: data }),

    delete: (id: number) =>
        api.delete<string>(`/v1/coupons/${id}`),
};

// ======================== Brands (Admin) ========================

export const brandApi = {
    getActive: () => api.get<BrandResponse[]>("/v1/brands", { noAuth: true }),
    getAll: () => api.get<BrandResponse[]>("/v1/admin/brands"),
    create: (data: Partial<BrandResponse>) => api.post<BrandResponse>("/v1/admin/brands", { body: data }),
    update: (id: number, data: Partial<BrandResponse>) => api.put<BrandResponse>(`/v1/admin/brands/${id}`, { body: data }),
    delete: (id: number) => api.delete<void>(`/v1/admin/brands/${id}`),
};

// ======================== Blog (Admin) ========================

export const blogApi = {
    getPosts: (page = 0, size = 10) =>
        api.get<CursorResponse<BlogPost>>("/v1/blog", { params: { page, size }, noAuth: true }),
    getPostBySlug: (slug: string) =>
        api.get<BlogPost>(`/v1/blog/${slug}`, { noAuth: true }),
    getCategories: () =>
        api.get<BlogCategory[]>("/v1/blog/categories", { noAuth: true }),
    adminGetPosts: (page = 0, size = 20) =>
        api.get<CursorResponse<BlogPost>>("/v1/admin/blog", { params: { page, size } }),
    adminCreatePost: (data: Partial<BlogPost>) =>
        api.post<BlogPost>("/v1/admin/blog", { body: data }),
    adminUpdatePost: (id: number, data: Partial<BlogPost>) =>
        api.put<BlogPost>(`/v1/admin/blog/${id}`, { body: data }),
    adminDeletePost: (id: number) =>
        api.delete<void>(`/v1/admin/blog/${id}`),
    adminGetCategories: () =>
        api.get<BlogCategory[]>("/v1/admin/blog/categories"),
    adminCreateCategory: (data: Partial<BlogCategory>) =>
        api.post<BlogCategory>("/v1/admin/blog/categories", { body: data }),
    adminUpdateCategory: (id: number, data: Partial<BlogCategory>) =>
        api.put<BlogCategory>(`/v1/admin/blog/categories/${id}`, { body: data }),
    adminDeleteCategory: (id: number) =>
        api.delete<void>(`/v1/admin/blog/categories/${id}`),
};

// ======================== Contact Requests (Admin) ========================

export const contactApi = {
    submit: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
        api.post<ContactRequestResponse>("/v1/contact", { body: data, noAuth: true }),
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ContactRequestResponse>>("/v1/admin/contact-requests", { params: { page, size } }),
    getUnreadCount: () =>
        api.get<{ count: number }>("/v1/admin/contact-requests/unread-count"),
    update: (id: number, data: Partial<ContactRequestResponse>) =>
        api.put<ContactRequestResponse>(`/v1/admin/contact-requests/${id}`, { body: data }),
    delete: (id: number) =>
        api.delete<void>(`/v1/admin/contact-requests/${id}`),
};

// ======================== Bank Transfers (Admin) ========================

export const bankTransferApi = {
    submit: (data: Partial<BankTransferResponse>) => api.post<BankTransferResponse>("/v1/bank-transfers", { body: data }),
    getAll: (page = 0, size = 20, status?: string) =>
        api.get<CursorResponse<BankTransferResponse>>("/v1/admin/bank-transfers", { params: { page, size, status } }),
    getPendingCount: () =>
        api.get<{ count: number }>("/v1/admin/bank-transfers/pending-count"),
    update: (id: number, data: Partial<BankTransferResponse>) =>
        api.put<BankTransferResponse>(`/v1/admin/bank-transfers/${id}`, { body: data }),
};

// ======================== Popups (Admin) ========================

export const popupApi = {
    getActive: () => api.get<PopupResponse[]>("/v1/popups/active", { noAuth: true }),
    getAll: () => api.get<PopupResponse[]>("/v1/admin/popups"),
    create: (data: Partial<PopupResponse>) => api.post<PopupResponse>("/v1/admin/popups", { body: data }),
    update: (id: number, data: Partial<PopupResponse>) => api.put<PopupResponse>(`/v1/admin/popups/${id}`, { body: data }),
    delete: (id: number) => api.delete<void>(`/v1/admin/popups/${id}`),
};

// ======================== Reviews (Admin) ========================

export const reviewAdminApi = {
    getAll: (page = 0, size = 20) =>
        api.get<CursorResponse<ReviewResponse>>("/v1/review/admin/all", { params: { page, size } }),
};

