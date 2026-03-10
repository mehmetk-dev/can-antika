package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestBlogController;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.model.BlogCategory;
import com.mehmetkerem.model.BlogPost;
import com.mehmetkerem.service.IBlogService;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RestBlogControllerImpl implements IRestBlogController {

    private final IBlogService blogService;

    // Mapping for Categories
    private com.mehmetkerem.dto.response.BlogCategoryResponse toCatResponse(BlogCategory cat) {
        return com.mehmetkerem.dto.response.BlogCategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .slug(cat.getSlug())
                .active(cat.isActive())
                .build();
    }

    private BlogCategory toCatEntity(com.mehmetkerem.dto.request.BlogCategoryRequest req) {
        BlogCategory cat = new BlogCategory();
        cat.setName(req.getName());
        cat.setSlug(req.getSlug());
        cat.setActive(req.isActive());
        return cat;
    }

    // Mapping for Posts
    private com.mehmetkerem.dto.response.BlogPostResponse toPostResponse(BlogPost post) {
        return com.mehmetkerem.dto.response.BlogPostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .summary(post.getSummary())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .categoryId(post.getCategoryId())
                .author(post.getAuthor())
                .published(post.isPublished())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private BlogPost toPostEntity(com.mehmetkerem.dto.request.BlogPostRequest req) {
        BlogPost post = new BlogPost();
        post.setTitle(req.getTitle());
        post.setSlug(req.getSlug());
        post.setSummary(req.getSummary());
        post.setContent(req.getContent());
        post.setImageUrl(req.getImageUrl());
        post.setAuthor(req.getAuthor());
        post.setCategoryId(req.getCategoryId());
        post.setPublished(req.isPublished());
        return post;
    }

    // ===== PUBLIC =====
    @Override
    @GetMapping("/v1/blog")
    public ResultData<CursorResponse<com.mehmetkerem.dto.response.BlogPostResponse>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = blogService.getPublishedPosts(page, size);
        return ResultHelper.cursor(result.map(this::toPostResponse));
    }

    @Override
    @GetMapping("/v1/blog/{slug}")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> getPostBySlug(@PathVariable String slug) {
        return ResultHelper.success(toPostResponse(blogService.getPostBySlug(slug)));
    }

    @Override
    @GetMapping("/v1/blog/categories")
    public ResultData<List<com.mehmetkerem.dto.response.BlogCategoryResponse>> getActiveCategories() {
        return ResultHelper.success(blogService.getActiveCategories().stream().map(this::toCatResponse).toList());
    }

    // ===== ADMIN: Posts =====
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/blog")
    public ResultData<CursorResponse<com.mehmetkerem.dto.response.BlogPostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = blogService.getAllPosts(page, size);
        return ResultHelper.cursor(result.map(this::toPostResponse));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/blog")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> createPost(@RequestBody com.mehmetkerem.dto.request.BlogPostRequest post) {
        // Not: Category ayarı service katmanında veya burada yapılabilir.
        // Şimdilik postEntity'ye taşıyoruz, detayı servis çözer.
        BlogPost entity = toPostEntity(post);
        return ResultHelper.success(toPostResponse(blogService.savePost(entity)));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/blog/{id}")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> updatePost(@PathVariable Long id, @RequestBody com.mehmetkerem.dto.request.BlogPostRequest post) {
        return ResultHelper.success(toPostResponse(blogService.updatePost(id, toPostEntity(post))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/blog/{id}")
    public Result deletePost(@PathVariable Long id) {
        blogService.deletePost(id);
        return ResultHelper.ok();
    }

    // ===== ADMIN: Categories =====
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/blog/categories")
    public ResultData<List<com.mehmetkerem.dto.response.BlogCategoryResponse>> getAllCategories() {
        return ResultHelper.success(blogService.getAllCategories().stream().map(this::toCatResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/blog/categories")
    public ResultData<com.mehmetkerem.dto.response.BlogCategoryResponse> createCategory(@RequestBody com.mehmetkerem.dto.request.BlogCategoryRequest cat) {
        return ResultHelper.success(toCatResponse(blogService.saveCategory(toCatEntity(cat))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/blog/categories/{id}")
    public ResultData<com.mehmetkerem.dto.response.BlogCategoryResponse> updateCategory(@PathVariable Long id, @RequestBody com.mehmetkerem.dto.request.BlogCategoryRequest cat) {
        return ResultHelper.success(toCatResponse(blogService.updateCategory(id, toCatEntity(cat))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/blog/categories/{id}")
    public Result deleteCategory(@PathVariable Long id) {
        blogService.deleteCategory(id);
        return ResultHelper.ok();
    }
}
