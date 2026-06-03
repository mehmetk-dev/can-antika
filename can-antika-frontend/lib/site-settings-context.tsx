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
import { LEGAL_BUSINESS_INFO } from "@/components/legal/business-info";

const DEFAULTS: SiteSettingsResponse = {
    storeName: "Can Antika",
    businessType: "Antika Eşya Satışı",
    storeDescription: "1982'den gelen aile tecrübesiyle Can Antika çatısı altında seçkin antika ve koleksiyon ürünleri sunuyoruz.",
    companyName: LEGAL_BUSINESS_INFO.companyName,
    taxId: LEGAL_BUSINESS_INFO.taxId,
    taxOffice: LEGAL_BUSINESS_INFO.taxOffice,
    phone: LEGAL_BUSINESS_INFO.phone,
    email: "destek@canantika.com",
    website: "www.canantika.com",
    address: LEGAL_BUSINESS_INFO.address,
    whatsapp: LEGAL_BUSINESS_INFO.phone,
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
    metaTitle: "Can Antika | İstanbul Antika ve Koleksiyon Mağazası",
    metaDescription: "Can Antika, Beyoğlu Avrupa Pasajı'nda antika ve koleksiyon ürünleri sunar. Ürünleri, fiyatları, teslimat ve iade koşullarını siteden inceleyebilirsiniz.",
    metaKeywords: "antika, antika eşya, osmanlı, istanbul, koleksiyon",
    googleAnalyticsId: "",
    facebookPixelId: "",
    customHeadScripts: "",
    footerAbout: "1982'den gelen aile tecrübesiyle Can Antika çatısı altında geçmişin eşsiz güzelliklerini geleceğe taşıyoruz.",
    footerCopyright: "© 2026 Can Antika. Tüm hakları saklıdır.",
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
            .catch((e) => { console.error("Site ayarları yüklenemedi:", e) });
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
