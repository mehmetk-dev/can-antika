package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestBrandController;
import com.mehmetkerem.dto.request.BrandRequest;
import com.mehmetkerem.dto.response.BrandResponse;
import com.mehmetkerem.model.Brand;
import com.mehmetkerem.service.IBrandService;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RestBrandControllerImpl implements IRestBrandController {

    private final IBrandService brandService;

    private BrandResponse toResponse(Brand b) {
        return BrandResponse.builder()
                .id(b.getId()).name(b.getName()).slug(b.getSlug())
                .logoUrl(b.getLogoUrl()).active(b.isActive()).build();
    }

    private Brand toEntity(BrandRequest req) {
        Brand b = new Brand();
        b.setName(req.getName());
        b.setLogoUrl(req.getLogoUrl());
        b.setActive(req.isActive());
        return b;
    }

    @Override
    @GetMapping("/v1/brands")
    public ResultData<List<BrandResponse>> getActiveBrands() {
        return ResultHelper.success(brandService.findActiveBrands().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/brands")
    public ResultData<List<BrandResponse>> getAllBrands() {
        return ResultHelper.success(brandService.findAllBrands().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/brands")
    public ResultData<BrandResponse> createBrand(@RequestBody BrandRequest req) {
        return ResultHelper.success(toResponse(brandService.saveBrand(toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/brands/{id}")
    public ResultData<BrandResponse> updateBrand(@PathVariable Long id, @RequestBody BrandRequest req) {
        return ResultHelper.success(toResponse(brandService.updateBrand(id, toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/brands/{id}")
    public Result deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResultHelper.ok();
    }
}

