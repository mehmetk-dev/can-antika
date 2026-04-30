package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.mapper.ISiteSettingsMapper;
import com.mehmetkerem.model.SiteSettings;
import com.mehmetkerem.repository.SiteSettingsRepository;
import com.mehmetkerem.service.ISiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SiteSettingsService implements ISiteSettingsService {

    private final SiteSettingsRepository repository;
    private final ISiteSettingsMapper mapper;

    @Override
    @Cacheable(cacheNames = "siteSettings", key = "'single'")
    public SiteSettings get() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(SiteSettings.builder().build()));
    }

    @Override
    public SiteSettingsResponse getPublicSettings() {
        return mapper.toPublicResponse(get());
    }

    @Override
    public SiteSettingsResponse getAdminSettings() {
        return mapper.toAdminResponse(get());
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "siteSettings", key = "'single'")
    public SiteSettingsResponse updateSettings(SiteSettingsRequest request) {
        SiteSettings existing = get();
        mapper.applyRequest(existing, request);
        return mapper.toAdminResponse(repository.save(existing));
    }
}
