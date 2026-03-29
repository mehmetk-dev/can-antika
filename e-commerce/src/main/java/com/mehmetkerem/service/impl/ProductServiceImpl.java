package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.ProductRequest;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.ProductImportResponse;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.ProductMapper;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.repository.specification.ProductSpecification;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.service.ICategoryService;
import com.mehmetkerem.service.IFileStorageService;
import com.mehmetkerem.service.IPeriodService;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.product.ProductExcelParseResult;
import com.mehmetkerem.service.product.ProductExcelParser;
import com.mehmetkerem.service.product.ProductImportRow;
import com.mehmetkerem.service.product.ProductSlugGenerator;
import com.mehmetkerem.service.product.ProductSortResolver;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.util.Messages;
import com.mehmetkerem.util.ResultHelper;
import com.mehmetkerem.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements IProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ICategoryService categoryService;
    private final IPeriodService periodService;
    private final IFileStorageService fileStorageService;
    private final IActivityLogService activityLogService;
    private final ProductSortResolver productSortResolver;
    private final ProductExcelParser productExcelParser;
    private final ProductSlugGenerator productSlugGenerator;

    private static final int SLUG_SAVE_MAX_RETRIES = 5;

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
    public ProductResponse saveProduct(ProductRequest request) {
        CategoryResponse categoryResponse = categoryService.getCategoryResponseById(request.getCategoryId());
        Product entity = persistNewProduct(request);

        ProductResponse response = mapProductWithRelations(
                entity,
                Map.of(request.getCategoryId(), categoryResponse),
                entity.getPeriodId() == null
                        ? Map.of()
                        : periodService.getPeriodResponsesByIds(List.of(entity.getPeriodId())));
        activityLogService.log(ActivityType.PRODUCT_CREATED, SecurityUtils.getCurrentUserId(), "Ürün eklendi: " + request.getTitle());
        return response;
    }

    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
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
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        CategoryResponse categoryResponse = categoryService.getCategoryResponseById(request.getCategoryId());
        productMapper.update(product, request);
        Long resolvedPeriodId = resolvePeriodId(request, product.getPeriodId());
        product.setPeriodId(resolvedPeriodId);
        Product savedProduct = productRepository.save(product);
        Map<Long, PeriodResponse> periodMap = resolvedPeriodId == null
                ? Map.of()
                : periodService.getPeriodResponsesByIds(List.of(resolvedPeriodId));
        ProductResponse response = mapProductWithRelations(
                savedProduct,
                Map.of(savedProduct.getCategoryId(), categoryResponse),
                periodMap);
        activityLogService.log(ActivityType.PRODUCT_UPDATED, SecurityUtils.getCurrentUserId(), "Ürün güncellendi: " + product.getTitle());
        return response;
    }

    @Override
    @Cacheable(cacheNames = "products:byId", key = "#id")
    public ProductResponse getProductResponseById(Long id) {
        Product product = getProductById(id);
        return mapProductWithRelations(product);
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(
                () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "ürün")));
    }

    @Override
    public List<ProductResponse> findAllProducts() {
        List<Product> products = productRepository.findTop500ByOrderByIdDesc();
        return mapProductsWithRelations(products);
    }

    @Override
    public List<ProductResponse> getProductResponsesByIds(List<Long> productIds) {
        return mapProductsWithRelations(getProductsByIds(productIds));
    }

    @Override
    public List<Product> getProductsByIds(List<Long> productIds) {
        return productRepository.findByIdIn(productIds);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
    public List<Product> saveAllProducts(List<Product> products) {
        return productRepository.saveAll(products);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
    public void updateProductRating(Long productId, double averageRating, int reviewCount) {
        Product product = getProductById(productId);
        product.setAverageRating(averageRating);
        product.setReviewCount(reviewCount);
        productRepository.save(product);
    }

    @Override
    public List<ProductResponse> getProductsByTitle(String title) {
        if (title == null || title.trim().length() < 2) {
            return List.of();
        }
        List<Product> products = productRepository.findTop50ByTitleContainingIgnoreCase(title.trim());
        return mapProductsWithRelations(products);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        List<Product> products = productRepository.findTop200ByCategoryId(categoryId);
        return mapProductsWithRelations(products);
    }

    @Override
    public CursorResponse<ProductResponse> searchProducts(String title, Long categoryId, List<Long> categoryIds, Long periodId, List<Long> periodIds,
            BigDecimal minPrice, BigDecimal maxPrice, Double minRating, Pageable pageable) {

        Specification<Product> spec = Specification.where(ProductSpecification.hasTitle(title))
                .and(ProductSpecification.hasCategory(categoryId))
                .and(ProductSpecification.hasCategories(categoryIds))
                .and(ProductSpecification.hasPeriod(periodId))
                .and(ProductSpecification.hasPeriods(periodIds))
                .and(ProductSpecification.priceBetween(minPrice, maxPrice))
                .and(ProductSpecification.greaterThanRating(minRating));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        return toCursorWithRelations(productPage);
    }

    // NOTE:
    // products:list cache anahtarını versiyonlayarak eski/stale Redis kayıtlarından
    // kaynaklanan deserialization kaynaklı 500 hatalarını engeller.
    @Override
    @Cacheable(cacheNames = "products:list", key = "#root.target.buildListCacheKey(#page, #size, #sortBy, #direction)")
    public CursorResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String direction) {
        PageRequest pageable = PageRequest.of(page, size, productSortResolver.resolve(sortBy, direction));

        return toCursorWithRelations(productRepository.findAll(pageable));
    }

    public String buildListCacheKey(int page, int size, String sortBy, String direction) {
        String safeSortBy = productSortResolver.sanitizeSortBy(sortBy);
        String safeDirection = "desc".equalsIgnoreCase(direction) ? "desc" : "asc";
        return "v4;p=" + page + ";s=" + size + ";sort=" + safeSortBy + ";dir=" + safeDirection;
    }

    /**
     * Birden fazla ürünü batch olarak kategorileriyle eşleştirir.
     * N+1 sorunu yerine tek sorguda tüm kategorileri çeker.
     */
    private List<ProductResponse> mapProductsWithRelations(List<Product> products) {
        if (products.isEmpty()) {
            return List.of();
        }

        List<Long> categoryIds = products.stream()
                .map(Product::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<Long> periodIds = products.stream()
                .map(Product::getPeriodId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, CategoryResponse> categoryMap = categoryIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : categoryService.getCategoryResponsesByIds(categoryIds);

        Map<Long, PeriodResponse> periodMap = periodIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : periodService.getPeriodResponsesByIds(periodIds);

        return products.stream()
                .map(product -> mapProductWithRelations(product, categoryMap, periodMap))
                .toList();
    }

    private ProductResponse mapProductWithRelations(Product product) {
        CategoryResponse categoryResponse = null;
        if (product.getCategoryId() != null) {
            categoryResponse = categoryService.getCategoryResponsesByIds(List.of(product.getCategoryId()))
                    .get(product.getCategoryId());
        }
        PeriodResponse periodResponse = null;
        if (product.getPeriodId() != null) {
            periodResponse = periodService.getPeriodResponsesByIds(List.of(product.getPeriodId()))
                    .get(product.getPeriodId());
        }
        return mapProductWithRelations(
                product,
                categoryResponse == null ? Map.of() : Map.of(product.getCategoryId(), categoryResponse),
                periodResponse == null ? Map.of() : Map.of(product.getPeriodId(), periodResponse));
    }

    private ProductResponse mapProductWithRelations(
            Product product,
            Map<Long, CategoryResponse> categoryMap,
            Map<Long, PeriodResponse> periodMap) {
        CategoryResponse categoryResponse = product.getCategoryId() == null ? null : categoryMap.get(product.getCategoryId());
        PeriodResponse periodResponse = product.getPeriodId() == null ? null : periodMap.get(product.getPeriodId());
        ProductResponse response = productMapper.toResponseWithCategory(product, categoryResponse);
        response.setStock(product.getStock() == null ? 0 : product.getStock());
        response.setPeriod(periodResponse);
        return response;
    }

    private CursorResponse<ProductResponse> toCursorWithRelations(Page<Product> productPage) {
        List<ProductResponse> mappedItems = mapProductsWithRelations(productPage.getContent());
        Page<ProductResponse> mappedPage = new PageImpl<>(
                mappedItems,
                productPage.getPageable(),
                productPage.getTotalElements());
        return ResultHelper.toCursor(mappedPage);
    }

    private Long resolvePeriodId(ProductRequest request, Long fallbackPeriodId) {
        if (request.getPeriodId() != null) {
            return periodService.getPeriodById(request.getPeriodId()).getId();
        }

        String explicitPeriodName = normalizeOptional(request.getPeriodName());
        if (explicitPeriodName != null) {
            return periodService.findOrCreateByName(explicitPeriodName).getId();
        }

        if (request.getPeriodName() != null) {
            return null;
        }

        String periodFromAttributes = extractPeriodFromAttributes(request.getAttributes());
        if (periodFromAttributes != null) {
            return periodService.findOrCreateByName(periodFromAttributes).getId();
        }

        return fallbackPeriodId;
    }

    private String extractPeriodFromAttributes(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return null;
        }
        Object rawEra = attributes.get("era");
        if (rawEra == null) {
            return null;
        }
        return normalizeOptional(rawEra.toString());
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    @Cacheable(cacheNames = "products:bySlug", key = "#slug")
    public ProductResponse getProductBySlug(String slug) {
        // Önce slug ile ara
        var optionalProduct = productRepository.findBySlug(slug);

        // Slug bulunamazsa ve değer numeric ise ID ile dene (fallback)
        if (optionalProduct.isEmpty()) {
            try {
                Long id = Long.parseLong(slug);
                optionalProduct = productRepository.findById(id);
            } catch (NumberFormatException ignored) {
                // Numeric değil, fallback yapma
            }
        }

        Product product = optionalProduct
                .orElseThrow(() -> new com.mehmetkerem.exception.NotFoundException(
                        "Ürün bulunamadı: " + slug));
        return mapProductWithRelations(product);
    }

    @Transactional
    @Override
    @CacheEvict(cacheNames = "products:byId", key = "#productId")
    public void incrementViewCount(Long productId) {
        productRepository.incrementViewCount(productId);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId", "products:bySlug" }, allEntries = true)
    public ProductImportResponse importProductsFromExcel(MultipartFile file) {
        ProductExcelParseResult parsed = productExcelParser.parse(file);
        List<String> errors = new java.util.ArrayList<>(parsed.errors());
        int importedCount = 0;

        for (ProductImportRow row : parsed.rows()) {
            try {
                categoryService.getCategoryResponseById(row.request().getCategoryId());
                persistNewProduct(row.request());
                importedCount++;
            } catch (Exception ex) {
                errors.add("Satir " + row.rowNumber() + ": " + ex.getMessage());
            }
        }

        if (importedCount > 0) {
            activityLogService.log(
                    ActivityType.PRODUCT_CREATED,
                    SecurityUtils.getCurrentUserId(),
                    "Excel ile toplu urun ice aktarma yapildi. Eklenen: " + importedCount);
        }

        return ProductImportResponse.builder()
                .importedCount(importedCount)
                .failedCount(errors.size())
                .errors(errors)
                .build();
    }

    private Product persistNewProduct(ProductRequest request) {
        Product entity = productMapper.toEntity(request);
        entity.setPeriodId(resolvePeriodId(request, null));
        return saveWithUniqueSlug(entity);
    }

    private Product saveWithUniqueSlug(Product entity) {
        String baseSlug = productSlugGenerator.toBaseSlug(entity.getTitle());

        for (int attempt = 0; attempt < SLUG_SAVE_MAX_RETRIES; attempt++) {
            entity.setSlug(createSlugCandidate(baseSlug, attempt));
            try {
                return productRepository.save(entity);
            } catch (DataIntegrityViolationException ex) {
                if (!isSlugConstraintViolation(ex) || attempt == SLUG_SAVE_MAX_RETRIES - 1) {
                    throw ex;
                }
                log.warn("Slug cakismasi algilandi, yeni aday denenecek. slug={}, deneme={}",
                        entity.getSlug(), attempt + 1);
            }
        }

        throw new BadRequestException("Urun slug olusturulamadi. Lutfen tekrar deneyin.");
    }

    private String createSlugCandidate(String baseSlug, int saveAttempt) {
        String seed = saveAttempt == 0
                ? baseSlug
                : baseSlug + "-" + UUID.randomUUID().toString().substring(0, 6);

        for (int collisionIndex = 0; collisionIndex < 1000; collisionIndex++) {
            String candidate = productSlugGenerator.buildCandidate(seed, collisionIndex);
            if (!productRepository.existsBySlug(candidate)) {
                return candidate;
            }
        }

        throw new BadRequestException("Urun slug olusturulamadi. Lutfen tekrar deneyin.");
    }

    private boolean isSlugConstraintViolation(DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        return message != null && message.toLowerCase(Locale.ROOT).contains("slug");
    }
}

