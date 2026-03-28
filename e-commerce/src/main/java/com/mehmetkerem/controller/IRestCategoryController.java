package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.CategoryRequest;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.util.ResultData;

import java.util.List;
import java.util.Map;

public interface IRestCategoryController {

    ResultData<CategoryResponse> saveCategory(CategoryRequest request);

    ResultData<String> deleteCategory(Long id);

    ResultData<CategoryResponse> getCategoryById(Long id);

    ResultData<CategoryResponse> updateCategory(Long id, CategoryRequest request);

    ResultData<List<CategoryResponse>> findAllCategories();

    ResultData<Map<Long, Long>> getProductCountsByCategory();
}
