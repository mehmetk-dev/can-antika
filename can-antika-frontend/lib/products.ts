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
  { value: "0-50000", label: "₺50.000'e kadar", min: 0, max: 50000 },
  { value: "50000-100000", label: "₺50.000 - ₺100.000", min: 50000, max: 100000 },
  { value: "100000-200000", label: "₺100.000 - ₺200.000", min: 100000, max: 200000 },
  { value: "200000+", label: "₺200.000 ve üzeri", min: 200000, max: Number.POSITIVE_INFINITY },
]
