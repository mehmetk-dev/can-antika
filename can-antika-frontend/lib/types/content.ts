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

export interface StaticPage {
    id: number;
    title: string;
    slug: string;
    content: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    displayOrder: number;
    active: boolean;
}

export interface PopupResponse {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    linkUrl?: string;
    linkText?: string;
    active: boolean;
    position: string;
    delaySeconds: number;
    showOnce: boolean;
    startDate?: string;
    endDate?: string;
}

export interface NewsletterSubscriber {
    id: number;
    email: string;
    name?: string;
    subscribedAt: string;
}
