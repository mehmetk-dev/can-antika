// Re-export hub — domain API modules

// User
export { authApi } from "./user/auth";
export { addressApi } from "./user/address";
export { notificationApi } from "./user/notifications";
export { supportTicketApi } from "./user/support-ticket";

// Catalog
export { productApi } from "./catalog/product";
export { periodApi } from "./catalog/period";
export { categoryApi } from "./catalog/category";
export { reviewApi, reviewAdminApi } from "./catalog/review";

// Commerce
export { cartApi } from "./commerce/cart";
export { orderApi } from "./commerce/order";
export { wishlistApi } from "./commerce/wishlist";
export { paymentApi } from "./commerce/payment";
export { orderReturnApi } from "./commerce/order-return";

// Content
export { fileApi } from "./content/file";
export { siteSettingsApi } from "./content/site-settings";

// Admin modules
export { statsApi } from "./admin/stats";
export { userApi } from "./admin/users";
export { activityLogApi } from "./admin/activity-log";
export { newsletterApi } from "./admin/newsletter";
export { faqApi } from "./admin/faq";
export { staticPageApi } from "./admin/pages";
export { reportApi } from "./admin/reports";
export { couponApi } from "./admin/coupons";
export { brandApi } from "./admin/brands";
export { blogApi } from "./admin/blog";
export { contactApi } from "./admin/contact";
export { bankTransferApi } from "./admin/bank-transfers";
export { popupApi } from "./admin/popups";
