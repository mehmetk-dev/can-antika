package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.ProductRequest;
import com.mehmetkerem.dto.response.ProductImportResponse;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.ProductMapper;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.service.ICategoryService;
import com.mehmetkerem.service.IFileStorageService;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.service.IPeriodService;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.util.SecurityUtils;
import com.mehmetkerem.util.Messages;
import com.mehmetkerem.util.ResultHelper;
import com.mehmetkerem.dto.response.CursorResponse;
import org.springframework.data.domain.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import com.mehmetkerem.repository.specification.ProductSpecification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

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
        private static final Set<String> ALLOWED_PRODUCT_SORT_FIELDS = Set.of(
            "id", "title", "price", "stock", "averageRating", "reviewCount", "viewCount");

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    public ProductResponse saveProduct(ProductRequest request) {
        Product entity = productMapper.toEntity(request);
        entity.setPeriodId(resolvePeriodId(request, null));
        entity = productRepository.save(entity);

        // Slug'ı ID ile benzersiz yap ve tekrar kaydet
        if (entity.getSlug() != null && entity.getId() != null
                && !entity.getSlug().endsWith("-" + entity.getId())) {
            entity.setSlug(entity.getSlug() + "-" + entity.getId());
            entity = productRepository.save(entity);
        }

        ProductResponse response = mapProductWithRelations(
                entity,
                Map.of(request.getCategoryId(), categoryService.getCategoryResponseById(request.getCategoryId())),
                entity.getPeriodId() == null
                        ? Map.of()
                        : periodService.getPeriodResponsesByIds(List.of(entity.getPeriodId())));
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
        product.setPeriodId(resolvePeriodId(request, product.getPeriodId()));
        Product savedProduct = productRepository.save(product);
        ProductResponse response = mapProductWithRelations(
                savedProduct,
                Map.of(savedProduct.getCategoryId(), categoryService.getCategoryResponseById(savedProduct.getCategoryId())),
                savedProduct.getPeriodId() == null
                        ? Map.of()
                        : periodService.getPeriodResponsesByIds(List.of(savedProduct.getPeriodId())));
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
        List<Product> products = productRepository.findAll();
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
        return mapProductsWithRelations(products);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return mapProductsWithRelations(products);
    }

    @Override
    public com.mehmetkerem.dto.response.CursorResponse<ProductResponse> searchProducts(String title, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
            Double minRating, Pageable pageable) {

        Specification<Product> spec = Specification.where(ProductSpecification.hasTitle(title))
                .and(ProductSpecification.hasCategory(categoryId))
                .and(ProductSpecification.priceBetween(minPrice, maxPrice))
                .and(ProductSpecification.greaterThanRating(minRating));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        return ResultHelper.toCursor(productPage.map(this::mapProductWithRelations));
    }

    // NOTE:
    // products:list cache anahtarını versiyonlayarak eski/stale Redis kayıtlarından
    // kaynaklanan deserialization kaynaklı 500 hatalarını engeller.
    @Override
    @Cacheable(cacheNames = "products:list", key = "'v3;p='+#page+';s='+#size+';sort='+#sortBy+';dir='+#direction")
    public com.mehmetkerem.dto.response.CursorResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String direction) {
        String safeSortBy = ALLOWED_PRODUCT_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
        Sort sort = direction.equalsIgnoreCase("desc")
            ? Sort.by(safeSortBy).descending()
            : Sort.by(safeSortBy).ascending();

        PageRequest pageable = PageRequest.of(page, size, sort);

        return ResultHelper.toCursor(productRepository.findAll(pageable).map(this::mapProductWithRelations));
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
        response.setPeriod(periodResponse);
        return response;
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
    public void incrementViewCount(Long productId) {
        productRepository.incrementViewCount(productId);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = { "products:list", "products:byId" }, allEntries = true)
    public ProductImportResponse importProductsFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Excel dosyası boş olamaz.");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!originalName.endsWith(".xlsx")) {
            throw new BadRequestException("Sadece .xlsx formatı destekleniyor.");
        }

        List<String> errors = new ArrayList<>();
        int importedCount = 0;

        try (InputStream inputStream = file.getInputStream(); XSSFWorkbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new BadRequestException("Excel dosyası boş.");
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Başlık satırı bulunamadı.");
            }

            Map<String, Integer> headers = extractHeaders(headerRow);
            validateRequiredHeaders(headers);

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                try {
                    ProductRequest request = toProductRequest(row, headers);
                    categoryService.getCategoryResponseById(request.getCategoryId());
                    Product entity = productMapper.toEntity(request);
                    entity.setPeriodId(resolvePeriodId(request, null));
                    productRepository.save(entity);
                    importedCount++;
                } catch (Exception ex) {
                    errors.add("Satır " + (r + 1) + ": " + ex.getMessage());
                }
            }
        } catch (IOException ex) {
            throw new BadRequestException("Excel dosyası okunamadı.");
        }

        if (importedCount > 0) {
            activityLogService.log(ActivityType.PRODUCT_CREATED, SecurityUtils.getCurrentUserId(),
                    "Excel ile toplu ürün içe aktarma yapıldı. Eklenen: " + importedCount);
        }

        return ProductImportResponse.builder()
                .importedCount(importedCount)
                .failedCount(errors.size())
                .errors(errors)
                .build();
    }

    private Map<String, Integer> extractHeaders(Row headerRow) {
        Map<String, Integer> headers = new HashMap<>();
        DataFormatter formatter = new DataFormatter();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String key = formatter.formatCellValue(headerRow.getCell(i)).trim().toLowerCase();
            if (!key.isEmpty()) headers.put(key, i);
        }
        return headers;
    }

    private void validateRequiredHeaders(Map<String, Integer> headers) {
        List<String> required = List.of("title", "price", "stock", "categoryid");
        List<String> missing = required.stream().filter(h -> !headers.containsKey(h)).toList();
        if (!missing.isEmpty()) {
            throw new BadRequestException("Eksik kolon(lar): " + String.join(", ", missing));
        }
    }

    private ProductRequest toProductRequest(Row row, Map<String, Integer> headers) {
        ProductRequest request = new ProductRequest();
        request.setTitle(readString(row, headers, "title", true));
        request.setDescription(readString(row, headers, "description", false));
        request.setPrice(readBigDecimal(row, headers, "price", true));
        request.setStock(readInteger(row, headers, "stock", true));
        request.setCategoryId(readLong(row, headers, "categoryid", true));
        request.setPeriodName(resolveExcelPeriodName(row, headers));
        request.setImageUrls(readImageUrls(row, headers, "imageurls"));

        Map<String, Object> attrs = new HashMap<>();
        putIfPresent(attrs, "era", readString(row, headers, "era", false));
        putIfPresent(attrs, "material", readString(row, headers, "material", false));
        putIfPresent(attrs, "status", readString(row, headers, "status", false));
        putIfPresent(attrs, "dimensions", readString(row, headers, "dimensions", false));
        putIfPresent(attrs, "condition", readString(row, headers, "condition", false));
        putIfPresent(attrs, "conditionDetails", readString(row, headers, "conditiondetails", false));
        putIfPresent(attrs, "provenance", readString(row, headers, "provenance", false));
        if (!attrs.isEmpty()) request.setAttributes(attrs);

        return request;
    }

    private String resolveExcelPeriodName(Row row, Map<String, Integer> headers) {
        String periodName = readString(row, headers, "period", false);
        if (periodName != null && !periodName.isBlank()) {
            return periodName;
        }
        String era = readString(row, headers, "era", false);
        return (era == null || era.isBlank()) ? null : era;
    }

    private List<String> readImageUrls(Row row, Map<String, Integer> headers, String key) {
        if (!headers.containsKey(key)) {
            return new ArrayList<>();
        }
        String raw = readString(row, headers, key, false);
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        List<String> urls = java.util.Arrays.stream(raw.split("\\|"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return new ArrayList<>(urls);
    }

    private String readString(Row row, Map<String, Integer> headers, String key, boolean required) {
        Integer idx = headers.get(key);
        if (idx == null) return "";
        DataFormatter formatter = new DataFormatter();
        String value = formatter.formatCellValue(row.getCell(idx)).trim();
        if (required && value.isEmpty()) {
            throw new BadRequestException(key + " alanı zorunlu.");
        }
        return value;
    }

    private BigDecimal readBigDecimal(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value.isEmpty()) return null;
        try {
            return new BigDecimal(value.replace(",", "."));
        } catch (Exception ex) {
            throw new BadRequestException(key + " geçerli bir sayı olmalı.");
        }
    }

    private Integer readInteger(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value.isEmpty()) return null;
        try {
            return Integer.parseInt(value.replace(".0", ""));
        } catch (Exception ex) {
            throw new BadRequestException(key + " geçerli bir tam sayı olmalı.");
        }
    }

    private Long readLong(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value.isEmpty()) return null;
        try {
            return Long.parseLong(value.replace(".0", ""));
        } catch (Exception ex) {
            throw new BadRequestException(key + " geçerli bir sayı olmalı.");
        }
    }

    private boolean isRowEmpty(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != org.apache.poi.ss.usermodel.CellType.BLANK) {
                DataFormatter formatter = new DataFormatter();
                if (!formatter.formatCellValue(cell).trim().isEmpty()) return false;
            }
        }
        return true;
    }

    private void putIfPresent(Map<String, Object> attrs, String key, String value) {
        if (value != null && !value.isBlank()) attrs.put(key, value);
    }
}
