package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestSiteSettingsController;
import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.service.ISiteSettingsService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/site-settings")
@RequiredArgsConstructor
public class RestSiteSettingsController implements IRestSiteSettingsController {

    private final ISiteSettingsService service;

    @Override
    @GetMapping
    public ResultData<SiteSettingsResponse> get() {
        return ResultHelper.success(service.getPublicSettings());
    }

    @Override
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResultData<SiteSettingsResponse> getAdmin() {
        return ResultHelper.success(service.getAdminSettings());
    }

    @Override
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResultData<SiteSettingsResponse> update(@jakarta.validation.Valid @RequestBody SiteSettingsRequest req) {
        return ResultHelper.success(service.updateSettings(req));
    }
}
