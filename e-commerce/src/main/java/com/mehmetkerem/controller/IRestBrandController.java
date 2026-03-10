package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.BrandRequest;
import com.mehmetkerem.dto.response.BrandResponse;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestBrandController {
    ResultData<List<BrandResponse>> getActiveBrands();
    ResultData<List<BrandResponse>> getAllBrands();
    ResultData<BrandResponse> createBrand(BrandRequest req);
    ResultData<BrandResponse> updateBrand(Long id, BrandRequest req);
    Result deleteBrand(Long id);
}

