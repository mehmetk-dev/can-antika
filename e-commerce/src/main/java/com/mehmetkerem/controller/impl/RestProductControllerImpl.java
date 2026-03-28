package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestProductController;
import com.mehmetkerem.dto.request.ProductRequest;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.product.ProductSortResolver;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import jakarta.validation.Valid;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/v1/product")
public class RestProductControllerImpl implements IRestProductController {

    private final IProductService productService;
    private final ProductSortResolver productSortResolver;

    public RestProductControllerImpl(IProductService productService, ProductSortResolver productSortResolver) {
        this.productService = productService;
        this.productSortResolver = productSortResolver;
    }

    private Sort resolveProductSort(String sortBy, String direction) {
        return productSortResolver.resolve(sortBy, direction);
    }

    @Secured("ROLE_ADMIN")
    @PostMapping("/save")
    @Override
    public ResultData<ProductResponse> saveProduct(@Valid @RequestBody ProductRequest request) {
        return ResultHelper.success(productService.saveProduct(request));
    }

    @GetMapping("/find-all")
    @Override
    public ResultData<List<ProductResponse>> findAllProducts() {
        return ResultHelper.success(productService.findAllProducts());
    }

    @Secured("ROLE_ADMIN")
    @PutMapping("/{id}")
    @Override
    public ResultData<ProductResponse> updateProduct(@PathVariable("id") Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResultHelper.success(productService.updateProduct(id, request));
    }

    @GetMapping("/search/title")
    @Override
    public ResultData<List<ProductResponse>> searchProductsByTitle(@RequestParam String title) {
        return ResultHelper.success(productService.getProductsByTitle(title));
    }

    @GetMapping("/search/category")
    @Override
    public ResultData<List<ProductResponse>> searchProductsByCategoryId(@RequestParam Long categoryId) {
        return ResultHelper.success(productService.getProductsByCategory(categoryId));
    }

    @GetMapping("/search")
    @Override
    public ResultData<CursorResponse<ProductResponse>> searchProducts(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) List<Long> periodIds,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = resolveProductSort(sortBy, direction);
        int cappedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(page, cappedSize, sort);
        CursorResponse<ProductResponse> cursorResult = productService.searchProducts(
                title,
                categoryId,
                categoryIds,
                periodId,
                periodIds,
                minPrice,
                maxPrice,
                minRating,
                pageable);
        return ResultHelper.success(cursorResult);
    }

    @Secured("ROLE_ADMIN")
    @DeleteMapping("/{id}")
    @Override
    public ResultData<String> deleteProduct(@PathVariable("id") Long id) {
        return ResultHelper.success(productService.deleteProduct(id));
    }

    @GetMapping("/{id}")
    @Override
    public ResultData<ProductResponse> getProductById(@PathVariable("id") Long id) {
        return ResultHelper.success(productService.getProductResponseById(id));
    }

    @GetMapping
    public ResultData<CursorResponse<ProductResponse>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        int cappedSize = Math.min(Math.max(size, 1), 100);
        CursorResponse<ProductResponse> cursorResult = productService.getAllProducts(page, cappedSize, sortBy, direction);
        return ResultHelper.success(cursorResult);
    }

    @Override
    @GetMapping("/slug/{slug}")
    public ResultData<ProductResponse> getProductBySlug(@PathVariable String slug) {
        return ResultHelper.success(productService.getProductBySlug(slug));
    }

    @Override
    @PostMapping("/{id}/view")
    public ResultData<String> incrementViewCount(@PathVariable Long id) {
        productService.incrementViewCount(id);
        return ResultHelper.success("OK");
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/import-excel")
    public ResultData<com.mehmetkerem.dto.response.ProductImportResponse> importProductsFromExcel(@RequestParam("file") MultipartFile file) {
        return ResultHelper.success(productService.importProductsFromExcel(file));
    }
}
