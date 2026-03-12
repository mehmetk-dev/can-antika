package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestBlogController;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.mapper.BlogMapper;
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
    private final BlogMapper blogMapper;

    // ===== PUBLIC =====
    @Override
    @GetMapping("/v1/blog")
    public ResultData<CursorResponse<com.mehmetkerem.dto.response.BlogPostResponse>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = blogService.getPublishedPosts(page, size);
        return ResultHelper.cursor(result.map(blogMapper::toPostResponse));
    }

    @Override
    @GetMapping("/v1/blog/{slug}")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> getPostBySlug(@PathVariable String slug) {
        return ResultHelper.success(blogMapper.toPostResponse(blogService.getPostBySlug(slug)));
    }

    @Override
    @GetMapping("/v1/blog/categories")
    public ResultData<List<com.mehmetkerem.dto.response.BlogCategoryResponse>> getActiveCategories() {
        return ResultHelper.success(blogService.getActiveCategories().stream().map(blogMapper::toCategoryResponse).toList());
    }

    // ===== ADMIN: Posts =====
    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/blog")
    public ResultData<CursorResponse<com.mehmetkerem.dto.response.BlogPostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = blogService.getAllPosts(page, size);
        return ResultHelper.cursor(result.map(blogMapper::toPostResponse));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/blog")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> createPost(@RequestBody com.mehmetkerem.dto.request.BlogPostRequest post) {
        // Not: Category ayarı service katmanında veya burada yapılabilir.
        // Şimdilik postEntity'ye taşıyoruz, detayı servis çözer.
        BlogPost entity = blogMapper.toPostEntity(post);
        return ResultHelper.success(blogMapper.toPostResponse(blogService.savePost(entity)));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/blog/{id}")
    public ResultData<com.mehmetkerem.dto.response.BlogPostResponse> updatePost(@PathVariable Long id, @RequestBody com.mehmetkerem.dto.request.BlogPostRequest post) {
        return ResultHelper.success(blogMapper.toPostResponse(blogService.updatePost(id, blogMapper.toPostEntity(post))));
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
        return ResultHelper.success(blogService.getAllCategories().stream().map(blogMapper::toCategoryResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/blog/categories")
    public ResultData<com.mehmetkerem.dto.response.BlogCategoryResponse> createCategory(@RequestBody com.mehmetkerem.dto.request.BlogCategoryRequest cat) {
        return ResultHelper.success(blogMapper.toCategoryResponse(blogService.saveCategory(blogMapper.toCategoryEntity(cat))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/blog/categories/{id}")
    public ResultData<com.mehmetkerem.dto.response.BlogCategoryResponse> updateCategory(@PathVariable Long id, @RequestBody com.mehmetkerem.dto.request.BlogCategoryRequest cat) {
        return ResultHelper.success(blogMapper.toCategoryResponse(blogService.updateCategory(id, blogMapper.toCategoryEntity(cat))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/blog/categories/{id}")
    public Result deleteCategory(@PathVariable Long id) {
        blogService.deleteCategory(id);
        return ResultHelper.ok();
    }
}
