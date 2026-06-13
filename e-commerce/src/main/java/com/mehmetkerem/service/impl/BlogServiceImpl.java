package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.BlogCategory;
import com.mehmetkerem.model.BlogPost;
import com.mehmetkerem.repository.BlogCategoryRepository;
import com.mehmetkerem.repository.BlogPostRepository;
import com.mehmetkerem.service.IBlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlogServiceImpl implements IBlogService {

    private final BlogPostRepository postRepository;
    private final BlogCategoryRepository categoryRepository;

    @Override
    public Page<BlogPost> getPublishedPosts(int page, int size) {
        return postRepository.findByPublishedTrueOrderByCreatedAtDesc(
                com.mehmetkerem.util.PageRequestUtils.of(page, size));
    }

    @Override
    public Page<BlogPost> getAllPosts(int page, int size) {
        return postRepository.findAll(com.mehmetkerem.util.PageRequestUtils.of(page, size));
    }

    @Override
    @Cacheable(cacheNames = "blog:post", key = "#slug")
    public BlogPost getPostBySlug(String slug) {
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Blog yazısı bulunamadı: " + slug));
    }

    @Override
    public BlogPost getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Blog yazısı bulunamadı: " + id));
    }

    @Override
    @CacheEvict(cacheNames = { "blog:posts", "blog:post" }, allEntries = true)
    public BlogPost savePost(BlogPost post) {
        validateCategory(post.getCategoryId());
        if (post.getSlug() == null || post.getSlug().isBlank()) {
            post.setSlug(ensureUniqueSlug(slugify(post.getTitle()), null));
        }
        return postRepository.save(post);
    }

    @Override
    @CacheEvict(cacheNames = { "blog:posts", "blog:post" }, allEntries = true)
    public BlogPost updatePost(Long id, BlogPost post) {
        validateCategory(post.getCategoryId());
        BlogPost existing = getPostById(id);
        existing.setTitle(post.getTitle());
        existing.setSlug(post.getSlug() != null && !post.getSlug().isBlank() ? post.getSlug() : ensureUniqueSlug(slugify(post.getTitle()), id));
        existing.setContent(post.getContent());
        existing.setSummary(post.getSummary());
        existing.setImageUrl(post.getImageUrl());
        existing.setCategoryId(post.getCategoryId());
        existing.setAuthor(post.getAuthor());
        existing.setPublished(post.isPublished());
        return postRepository.save(existing);
    }

    @Override
    @CacheEvict(cacheNames = { "blog:posts", "blog:post", "blog:categories" }, allEntries = true)
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    @Override
    @Cacheable(cacheNames = "blog:categories", key = "'active'")
    public List<BlogCategory> getActiveCategories() {
        return categoryRepository.findByActiveTrue();
    }

    @Override
    public List<BlogCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    @CacheEvict(cacheNames = { "blog:categories" }, allEntries = true)
    public BlogCategory saveCategory(BlogCategory category) {
        return categoryRepository.save(category);
    }

    @Override
    @CacheEvict(cacheNames = { "blog:categories" }, allEntries = true)
    public BlogCategory updateCategory(Long id, BlogCategory category) {
        BlogCategory existing = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Blog kategorisi bulunamadı: " + id));
        existing.setName(category.getName());
        existing.setSlug(category.getSlug());
        existing.setActive(category.isActive());
        return categoryRepository.save(existing);
    }

    @Override
    @CacheEvict(cacheNames = { "blog:categories", "blog:posts", "blog:post" }, allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    private String ensureUniqueSlug(String baseSlug, Long excludeId) {
        String slug = baseSlug;
        int counter = 1;
        while (postRepository.existsBySlug(slug)) {
            // If updating, the existing slug belongs to the same post — keep it
            var existing = postRepository.findBySlug(slug);
            if (excludeId != null && existing.isPresent() && existing.get().getId().equals(excludeId)) {
                break;
            }
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }

    private String slugify(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[ğ]", "g").replaceAll("[ü]", "u").replaceAll("[ş]", "s")
                .replaceAll("[ı]", "i").replaceAll("[ö]", "o").replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private void validateCategory(Long categoryId) {
        if (categoryId == null || categoryId <= 0) {
            throw new NotFoundException("Geçerli bir blog kategorisi seçmelisiniz.");
        }

        BlogCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Blog kategorisi bulunamadı: " + categoryId));

        if (!category.isActive()) {
            throw new NotFoundException("Pasif kategoriye yazı atanamaz: " + categoryId);
        }
    }
}
