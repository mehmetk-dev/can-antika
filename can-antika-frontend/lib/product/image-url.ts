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

export function isCloudinaryImageUrl(url?: string | null): boolean {
  return Boolean(url && url.includes("res.cloudinary.com") && url.includes("/upload/"))
}

export function toCloudinaryResponsiveUrl(rawUrl: string, width: number, quality?: number): string {
  if (!isCloudinaryImageUrl(rawUrl)) return rawUrl

  const safeWidth = Math.max(120, Math.min(1600, Math.round(width)))
  const q = quality ?? 75
  const transform = `f_auto,q_${q},c_limit,w_${safeWidth}`

  const uploadMarker = "/upload/"
  const uploadIndex = rawUrl.indexOf(uploadMarker)
  if (uploadIndex === -1) return rawUrl

  const prefix = rawUrl.slice(0, uploadIndex + uploadMarker.length)
  const suffix = rawUrl.slice(uploadIndex + uploadMarker.length)
  const firstSlashIndex = suffix.indexOf("/")
  const firstSegment = firstSlashIndex === -1 ? suffix : suffix.slice(0, firstSlashIndex)
  const remainingPath = firstSlashIndex === -1 ? "" : suffix.slice(firstSlashIndex + 1)

  const looksLikeTransform =
    firstSegment.includes(",") ||
    /^(?:f_|q_|c_|w_|h_|dpr_|g_|ar_|e_|l_|fl_)/.test(firstSegment)

  if (looksLikeTransform) {
    return `${prefix}${transform}/${remainingPath}`
  }

  return `${prefix}${transform}/${suffix}`
}
