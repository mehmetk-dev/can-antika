package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.BlogCategoryRequest;
import com.mehmetkerem.dto.request.BlogPostRequest;
import com.mehmetkerem.dto.response.BlogCategoryResponse;
import com.mehmetkerem.dto.response.BlogPostResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestBlogController {
    // Public
    ResultData<CursorResponse<BlogPostResponse>> getPublishedPosts(int page, int size);
    ResultData<BlogPostResponse> getPostBySlug(String slug);
    ResultData<List<BlogCategoryResponse>> getActiveCategories();

    // Admin Posts
    ResultData<CursorResponse<BlogPostResponse>> getAllPosts(int page, int size);
    ResultData<BlogPostResponse> createPost(BlogPostRequest post);
    ResultData<BlogPostResponse> updatePost(Long id, BlogPostRequest post);
    Result deletePost(Long id);

    // Admin Categories
    ResultData<List<BlogCategoryResponse>> getAllCategories();
    ResultData<BlogCategoryResponse> createCategory(BlogCategoryRequest cat);
    ResultData<BlogCategoryResponse> updateCategory(Long id, BlogCategoryRequest cat);
    Result deleteCategory(Long id);
}
