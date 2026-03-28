"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import type { SiteSettingsResponse } from "./types";
import { siteSettingsApi } from "./api";

const DEFAULTS: SiteSettingsResponse = {
    storeName: "Can Antika",
    businessType: "Antika Eşya Satışı",
    storeDescription: "1989'den beri İstanbul'da en kaliteli antika eşyaları sunuyoruz.",
    companyName: "Mesut Can (Şahıs İşletmesi)",
    taxId: "",
    taxOffice: "",
    phone: "+90 (212) 555-0123",
    email: "destek@canantika.com",
    website: "www.canantika.com",
    address: "Çukurcuma Caddesi No: 45, Beyoğlu, İstanbul",
    whatsapp: "+90 (212) 555-0123",
    weekdayHours: "10:00 - 18:00",
    saturdayHours: "11:00 - 17:00",
    standardDelivery: "3-5 iş günü",
    expressDelivery: "1-2 iş günü",
    freeShippingMin: 500,
    shippingDurationDays: 5,
    expressShippingFee: 49.90,
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    metaTitle: "Can Antika - Premium Antika Eşya Satışı İstanbul",
    metaDescription: "1989'den beri İstanbul'da en kaliteli antika eşyaları. Osmanlı, Viktoryen ve sanat eserleri.",
    metaKeywords: "antika, antika eşya, osmanlı, istanbul, koleksiyon",
    googleAnalyticsId: "",
    facebookPixelId: "",
    customHeadScripts: "",
    footerAbout: "1989'den beri İstanbul'un kalbinde, geçmişin eşsiz güzelliklerini geleceğe taşıyoruz.",
    footerCopyright: "© 2024 Can Antika. Tüm hakları saklıdır.",
    maintenanceMode: false,
    maintenanceMessage: "Sitemiz şu anda bakım modundadır. Kısa süre içinde tekrar hizmetinizde olacağız.",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "Can Antika",
    currency: "TRY",
    currencySymbol: "₺",
    smsProvider: "",
    smsApiKey: "",
    smsApiSecret: "",
    smsSenderName: "",
    smsEnabled: false,
    paymentProvider: "",
    paymentApiKey: "",
    paymentSecretKey: "",
    paymentMerchantId: "",
    paymentTestMode: true,
    creditCardEnabled: true,
    bankTransferEnabled: true,
    cashOnDeliveryEnabled: false,
};

const SiteSettingsContext = createContext<SiteSettingsResponse>(DEFAULTS);

export function SiteSettingsProvider({
    children,
    initialSettings,
}: {
    children: ReactNode;
    initialSettings?: SiteSettingsResponse | null;
}) {
    const [settings, setSettings] = useState<SiteSettingsResponse>(initialSettings ?? DEFAULTS);

    useEffect(() => {
        if (initialSettings) return;

        siteSettingsApi.get()
            .then(setSettings)
            .catch(() => { /* fallback to defaults */ });
    }, [initialSettings]);

    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings(): SiteSettingsResponse {
    return useContext(SiteSettingsContext);
}

export { DEFAULTS as SITE_SETTINGS_DEFAULTS };
