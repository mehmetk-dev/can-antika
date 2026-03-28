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

export interface BrandResponse {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
    active: boolean;
}
