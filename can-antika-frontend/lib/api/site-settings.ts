import { api } from "../api-client";
import type { SiteSettingsResponse } from "../types";

export const siteSettingsApi = {
    get: () =>
        api.get<SiteSettingsResponse>("/v1/site-settings", { noAuth: true }),

    /** Admin endpoint — SMTP, ödeme, SMS gibi hassas alanlar dahil */
    getAdmin: () =>
        api.get<SiteSettingsResponse>("/v1/site-settings/admin"),

    update: (data: SiteSettingsResponse) =>
        api.put<SiteSettingsResponse>("/v1/site-settings", { body: data }),
};
