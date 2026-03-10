package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.ProductRequest;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.ProductMapper;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.service.ICategoryService;
import com.mehmetkerem.service.IFileStorageService;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.util.SecurityUtils;
import com.mehmetkerem.util.Messages;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import com.mehmetkerem.repository.specification.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ICategoryService categoryService;
    private final IFileStorageService fileStorageService;
    private final IActivityLogService activityLogService;
        private static final Set<String> ALLOWED_PRODUCT_SORT_FIELDS = Set.of(
            "id", "title", "price", "stock", "averageRating", "reviewCount", "viewCount", "createdAt", "updatedAt");

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    public ProductResponse saveProduct(ProductRequest request) {
        ProductResponse response = productMapper.toResponseWithCategory(productRepository.save(productMapper.toEntity(request)),
                categoryService.getCategoryResponseById(request.getCategoryId()));
        activityLogService.log(ActivityType.PRODUCT_CREATED, SecurityUtils.getCurrentUserId(), "Ürün eklendi: " + request.getTitle());
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    @Override
    public String deleteProduct(Long id) {
        Product product = getProductById(id);

        // Delete images from Cloudinary (or local storage)
        if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
            product.getImageUrls().forEach(url -> {
                try {
                    fileStorageService.deleteFile(url);
                } catch (Exception e) {
                    log.warn("Resim silinirken hata oluştu: url={}, error={}", url, e.getMessage());
                }
            });
        }

        productRepository.delete(product);
        activityLogService.log(ActivityType.PRODUCT_DELETED, SecurityUtils.getCurrentUserId(), "Ürün silindi: " + product.getTitle());
        return String.format(Messages.DELETE_VALUE, id, "ürün");
    }

    @Override
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        productMapper.update(product, request);
        ProductResponse response = productMapper.toResponseWithCategory(productRepository.save(product),
                categoryService.getCategoryResponseById(product.getCategoryId()));
        activityLogService.log(ActivityType.PRODUCT_UPDATED, SecurityUtils.getCurrentUserId(), "Ürün güncellendi: " + product.getTitle());
        return response;
    }

    @Override
    @Cacheable(cacheNames = "products:byId", key = "#id")
    public ProductResponse getProductResponseById(Long id) {
        Product product = getProductById(id);
        return productMapper.toResponseWithCategory(
                product, categoryService.getCategoryResponseById(product.getCategoryId()));
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(
                () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "ürün")));
    }

    @Override
    public List<ProductResponse> findAllProducts() {
        List<Product> products = productRepository.findAll();

        // Batch fetch categories — single query instead of N
        List<Long> categoryIds = products.stream()
                .map(Product::getCategoryId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        java.util.Map<Long, com.mehmetkerem.dto.response.CategoryResponse> categoryMap = categoryIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : categoryService.getCategoryResponsesByIds(categoryIds);

        return products.stream()
                .map(product -> productMapper.toResponseWithCategory(
                        product, categoryMap.get(product.getCategoryId())))
                .toList();
    }

    @Override
    public List<ProductResponse> getProductResponsesByIds(List<Long> productIds) {
        return mapProductsWithCategories(getProductsByIds(productIds));
    }

    @Override
    public List<Product> getProductsByIds(List<Long> productIds) {
        return productRepository.findByIdIn(productIds);
    }

    @Override
    public List<Product> saveAllProducts(List<Product> products) {
        return productRepository.saveAll(products);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    public void updateProductRating(Long productId, double averageRating, int reviewCount) {
        Product product = getProductById(productId);
        product.setAverageRating(averageRating);
        product.setReviewCount(reviewCount);
        productRepository.save(product);
    }

    @Override
    public List<ProductResponse> getProductsByTitle(String title) {
        List<Product> products = productRepository.findByTitleContainingIgnoreCase(title);
        return mapProductsWithCategories(products);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return mapProductsWithCategories(products);
    }

    @Override
    public Page<ProductResponse> searchProducts(String title, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
            Double minRating, Pageable pageable) {

        Specification<Product> spec = Specification.where(ProductSpecification.hasTitle(title))
                .and(ProductSpecification.hasCategory(categoryId))
                .and(ProductSpecification.priceBetween(minPrice, maxPrice))
                .and(ProductSpecification.greaterThanRating(minRating));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        return productPage.map(this::mapProductWithCategory);
    }

    @Cacheable(cacheNames = "products:list", key = "'p='+#page+';s='+#size+';sort='+#sortBy+';dir='+#direction")
    public Page<ProductResponse> getAllProducts(int page, int size, String sortBy, String direction) {
        String safeSortBy = ALLOWED_PRODUCT_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
        Sort sort = direction.equalsIgnoreCase("desc")
            ? Sort.by(safeSortBy).descending()
            : Sort.by(safeSortBy).ascending();

        PageRequest pageable = PageRequest.of(page, size, sort);

        return productRepository.findAll(pageable).map(productMapper::toResponse);
    }

    /**
     * Birden fazla ürünü batch olarak kategorileriyle eşleştirir.
     * N+1 sorunu yerine tek sorguda tüm kategorileri çeker.
     */
    private List<ProductResponse> mapProductsWithCategories(List<Product> products) {
        if (products.isEmpty()) {
            return List.of();
        }

        List<Long> categoryIds = products.stream()
                .map(Product::getCategoryId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        java.util.Map<Long, CategoryResponse> categoryMap = categoryIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : categoryService.getCategoryResponsesByIds(categoryIds);

        return products.stream()
                .map(product -> productMapper.toResponseWithCategory(
                        product, categoryMap.get(product.getCategoryId())))
                .toList();
    }

    private ProductResponse mapProductWithCategory(Product product) {
        CategoryResponse categoryResponse = null;
        if (product.getCategoryId() != null) {
            categoryResponse = categoryService.getCategoryResponseById(product.getCategoryId());
        }
        return productMapper.toResponseWithCategory(product, categoryResponse);
    }

    @Override
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new com.mehmetkerem.exception.NotFoundException(
                        "Ürün bulunamadı: " + slug));
        return mapProductWithCategory(product);
    }

    @Transactional
    @Override
    public void incrementViewCount(Long productId) {
        productRepository.incrementViewCount(productId);
    }
}
