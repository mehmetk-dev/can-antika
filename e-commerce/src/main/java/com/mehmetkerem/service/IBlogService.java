package com.mehmetkerem.service;

import com.mehmetkerem.model.BlogCategory;
import com.mehmetkerem.model.BlogPost;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IBlogService {
    // Posts
    Page<BlogPost> getPublishedPosts(int page, int size);
    Page<BlogPost> getAllPosts(int page, int size);
    BlogPost getPostBySlug(String slug);
    BlogPost getPostById(Long id);
    BlogPost savePost(BlogPost post);
    BlogPost updatePost(Long id, BlogPost post);
    void deletePost(Long id);

    // Categories
    List<BlogCategory> getActiveCategories();
    List<BlogCategory> getAllCategories();
    BlogCategory saveCategory(BlogCategory category);
    BlogCategory updateCategory(Long id, BlogCategory category);
    void deleteCategory(Long id);
}
