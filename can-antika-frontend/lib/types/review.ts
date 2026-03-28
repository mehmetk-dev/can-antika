import type { ProductResponse } from "./product";
import type { UserResponse } from "./user";

export interface ReviewResponse {
    id: number;
    product?: ProductResponse;
    user?: UserResponse;
    comment: string;
    rating: number;
    createdAt: string;
}

export interface ReviewRequest {
    productId: number;
    userId: number;
    comment: string;
    rating: number;
}
