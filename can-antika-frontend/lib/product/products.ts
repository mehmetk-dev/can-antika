/**
 * Ürün filtre sabitleri.
 * Admin ürün formu ve katalog filtre sidebar'ı tarafından kullanılır.
 */

export const eras = [
  { value: "19th-century", label: "19. Yüzyıl" },
  { value: "ottoman", label: "Osmanlı" },
  { value: "victorian", label: "Viktoryen" },
  { value: "art-deco", label: "Art Deco" },
]

export const materials = [
  { value: "wood", label: "Ahşap" },
  { value: "brass", label: "Pirinç" },
  { value: "silver", label: "Gümüş" },
  { value: "bronze", label: "Bronz" },
  { value: "ceramic", label: "Seramik" },
  { value: "silk", label: "İpek" },
  { value: "crystal", label: "Kristal" },
  { value: "enamel", label: "Mine" },
  { value: "oil", label: "Yağlıboya" },
]

export const priceRanges = [
  { value: "0-500", label: "₺500'e kadar", min: 0, max: 500 },
  { value: "500-1000", label: "₺500 - ₺1.000", min: 500, max: 1000 },
  { value: "1000-5000", label: "₺1.000 - ₺5.000", min: 1000, max: 5000 },
  { value: "5000+", label: "₺5.000 ve üzeri", min: 5000, max: Number.POSITIVE_INFINITY },
]
