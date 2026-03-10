package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.StaticPageRequest;
import com.mehmetkerem.dto.response.StaticPageResponse;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;

import java.util.List;

public interface IRestStaticPageController {
    ResultData<StaticPageResponse> getBySlug(String slug);
    ResultData<List<StaticPageResponse>> getActivePages();
    ResultData<List<StaticPageResponse>> getAllPages();
    ResultData<StaticPageResponse> createPage(StaticPageRequest req);
    ResultData<StaticPageResponse> updatePage(Long id, StaticPageRequest req);
    Result deletePage(Long id);
}

