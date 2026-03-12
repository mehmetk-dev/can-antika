package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.util.ResultData;

public interface IRestSiteSettingsController {

    ResultData<SiteSettingsResponse> get();

    ResultData<SiteSettingsResponse> getAdmin();

    ResultData<SiteSettingsResponse> update(SiteSettingsRequest req);
}

