import type { ProductResponse } from "./product";
import type { UserResponse } from "./user";

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

export interface CartItemRequest {
    productId: number;
    quantity: number;
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
