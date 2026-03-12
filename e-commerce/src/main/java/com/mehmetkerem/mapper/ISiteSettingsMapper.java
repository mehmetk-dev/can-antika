package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.model.SiteSettings;

public interface ISiteSettingsMapper {

    /** Tüm alanlar — hassas alanlar maskelenir (admin paneli için). */
    SiteSettingsResponse toAdminResponse(SiteSettings entity);

    /** Public yanıt — hassas alanlar (SMTP, ödeme, SMS) dahil edilmez. */
    SiteSettingsResponse toPublicResponse(SiteSettings entity);

    /** İstek DTO'sundaki null olmayan alanları entity'ye uygular (partial update). */
    void applyRequest(SiteSettings entity, SiteSettingsRequest request);
}
