import { api } from "../api-client";
import type { CartResponse, CartItemRequest } from "../types";

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
