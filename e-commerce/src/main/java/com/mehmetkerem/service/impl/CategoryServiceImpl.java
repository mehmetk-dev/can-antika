package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CategoryRequest;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.CategoryMapper;
import com.mehmetkerem.model.Category;
import com.mehmetkerem.repository.CategoryRepository;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.service.ICategoryService;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.util.SecurityUtils;
import com.mehmetkerem.util.Messages;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements ICategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;
    private final IActivityLogService activityLogService;

    @Override
    public CategoryResponse saveCategory(CategoryRequest request) {
        String normalizedName = normalizeRequired(request.getName(), "Kategori adı boş olamaz.");

        if (categoryRepository.existsByName(normalizedName)) {
            throw new BadRequestException(
                    String.format(ExceptionMessages.CATEGORY_ALL_READY_EXISTS, normalizedName));
        }

        Category category = categoryMapper.toEntity(request);
        category.setName(normalizedName);
        category.setDescription(normalizeOptional(request.getDescription()));
        category.setCoverImageUrl(normalizeOptional(request.getCoverImageUrl()));

        Category savedCategory = categoryRepository.save(category);
        activityLogService.log(ActivityType.CATEGORY_CREATED, SecurityUtils.getCurrentUserId(), "Kategori eklendi: " + normalizedName);
        return categoryMapper.toResponse(savedCategory);
    }

    @Override
    public String deleteCategory(Long id) {
        Category category = getCategoryById(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Bu kategoriye bağlı ürünler var. Önce ürünleri başka kategoriye taşıyın veya silin.");
        }
        categoryRepository.delete(category);
        activityLogService.log(ActivityType.CATEGORY_DELETED, SecurityUtils.getCurrentUserId(), "Kategori silindi: " + category.getName());
        return String.format(Messages.DELETE_VALUE, id, "kategori");
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = getCategoryById(id);

        String normalizedName = normalizeRequired(request.getName(), "Kategori adı boş olamaz.");
        category.setName(normalizedName);
        category.setDescription(normalizeOptional(request.getDescription()));
        category.setCoverImageUrl(normalizeOptional(request.getCoverImageUrl()));

        activityLogService.log(ActivityType.CATEGORY_UPDATED, SecurityUtils.getCurrentUserId(), "Kategori güncellendi: " + category.getName());
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse getCategoryResponseById(Long id) {
        return categoryMapper.toResponse(getCategoryById(id));
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id).orElseThrow(
                () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "kategori")));
    }

    @Override
    public List<CategoryResponse> findAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    public Map<Long, CategoryResponse> getCategoryResponsesByIds(List<Long> ids) {
        return categoryRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Category::getId, categoryMapper::toResponse));
    }

    private String normalizeRequired(String value, String errorMessage) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new BadRequestException(errorMessage);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
