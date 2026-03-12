import { api } from "../api-client";
import type { WishlistResponse } from "../types";

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
