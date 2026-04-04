/**
 * Ürün URL'si oluşturur.
 * Backend slug'ı ID'siz döndürebilir (ör: "gumus-sigara-agizligi").
 * Doğru URL formatı: "gumus-sigara-agizligi-76" (slug-id).
 */
export function getProductUrl(product: { slug?: string | null; id: number }): string {
  if (product.slug) {
    // Slug zaten ID ile bitiyorsa tekrar ekleme
    if (product.slug.endsWith(`-${product.id}`)) {
      return `/urun/${product.slug}`
    }
    return `/urun/${product.slug}-${product.id}`
  }
  return `/urun/${product.id}`
}
