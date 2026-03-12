package com.mehmetkerem.service;

import com.mehmetkerem.dto.request.SiteSettingsRequest;
import com.mehmetkerem.dto.response.SiteSettingsResponse;
import com.mehmetkerem.model.SiteSettings;

public interface ISiteSettingsService {

    /** Ham entity — dahili servisler için (EmailTemplates, InvoicePdf vb.). */
    SiteSettings get();

    /** Public yanıt — hassas alanlar dahil edilmez. */
    SiteSettingsResponse getPublicSettings();

    /** Admin yanıt — hassas alanlar maskelenir. */
    SiteSettingsResponse getAdminSettings();

    /** Partial update — sadece doldurulan alanlar güncellenir. */
    SiteSettingsResponse updateSettings(SiteSettingsRequest request);
}
