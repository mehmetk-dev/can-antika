const DEFAULT_CLOUDINARY_BASE = "https://res.cloudinary.com/dqlbenxvc/image/upload/can-antika"

export function resolveImageUrl(raw?: string | null): string {
  const value = (raw || "").trim()
  if (!value) return "/placeholder.svg"

  let url = value

  // Eğer URL base eklenmesi gerekiyorsa (relative path ise)
  if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
    const base = (process.env.NEXT_PUBLIC_CLOUDINARY_BASE || DEFAULT_CLOUDINARY_BASE).replace(/\/$/, "")
    const normalizedPath = value.replace(/^\/+/, "")
    url = `${base}/${encodeURI(normalizedPath)}`
  }

  // Cloudinary URL'si ise f_auto,q_auto optimizasyonlarını enjekte et
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // Halihazırda optimizasyon eklenmemişse ekle
    if (!url.includes("/f_auto") && !url.includes("/q_auto")) {
      url = url.replace("/upload/", "/upload/f_auto,q_auto/")
    }
  }

  return url
}
