package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.BlogCategory;
import com.mehmetkerem.model.BlogPost;
import com.mehmetkerem.repository.BlogCategoryRepository;
import com.mehmetkerem.repository.BlogPostRepository;
import com.mehmetkerem.service.IBlogService;
import lombok.RequiredArgsConstructor;
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
        return postRepository.findByPublishedTrueOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Override
    public Page<BlogPost> getAllPosts(int page, int size) {
        return postRepository.findAll(PageRequest.of(page, size));
    }

    @Override
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
    public BlogPost savePost(BlogPost post) {
        validateCategory(post.getCategoryId());
        if (post.getSlug() == null || post.getSlug().isBlank()) {
            post.setSlug(slugify(post.getTitle()));
        }
        return postRepository.save(post);
    }

    @Override
    public BlogPost updatePost(Long id, BlogPost post) {
        validateCategory(post.getCategoryId());
        BlogPost existing = getPostById(id);
        existing.setTitle(post.getTitle());
        existing.setSlug(post.getSlug() != null && !post.getSlug().isBlank() ? post.getSlug() : slugify(post.getTitle()));
        existing.setContent(post.getContent());
        existing.setSummary(post.getSummary());
        existing.setImageUrl(post.getImageUrl());
        existing.setCategoryId(post.getCategoryId());
        existing.setAuthor(post.getAuthor());
        existing.setPublished(post.isPublished());
        return postRepository.save(existing);
    }

    @Override
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    @Override
    public List<BlogCategory> getActiveCategories() {
        return categoryRepository.findByActiveTrue();
    }

    @Override
    public List<BlogCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public BlogCategory saveCategory(BlogCategory category) {
        return categoryRepository.save(category);
    }

    @Override
    public BlogCategory updateCategory(Long id, BlogCategory category) {
        BlogCategory existing = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Blog kategorisi bulunamadı: " + id));
        existing.setName(category.getName());
        existing.setSlug(category.getSlug());
        existing.setActive(category.isActive());
        return categoryRepository.save(existing);
    }

    @Override
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
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
