/** Admin panel sayfalama boyutu */
export const ADMIN_PAGE_SIZE = 20;

/** Katalog sayfalama boyutu */
export const CATALOG_PAGE_SIZE = 20;

/** Kargo şirketleri */
export const CARRIERS = [
    "Yurtiçi Kargo",
    "Aras Kargo",
    "MNG Kargo",
    "Sürat Kargo",
    "PTT Kargo",
    "UPS",
    "DHL",
    "FedEx",
    "Trendyol Express",
    "Hepsijet",
] as const;

/** Dashboard grafik tarih aralıkları */
export const CHART_RANGES = [
    { value: "7D", label: "7 GÜNLÜK" },
    { value: "30D", label: "30 GÜNLÜK" },
    { value: "90D", label: "90 GÜNLÜK" },
    { value: "6M", label: "6 AYLIK" },
    { value: "1Y", label: "1 YILLIK" },
] as const;
