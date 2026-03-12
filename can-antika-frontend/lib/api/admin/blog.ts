import { api } from "../../api-client";
import type { BlogPost, BlogCategory, CursorResponse } from "../../types";

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
