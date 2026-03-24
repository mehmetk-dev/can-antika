const DEFAULT_CLOUDINARY_BASE = "https://res.cloudinary.com/dqlbenxvc/image/upload/can-antika"

export function resolveImageUrl(raw?: string | null): string {
  const value = (raw || "").trim()
  if (!value) return "/placeholder.svg"

  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("/")) return value

  const base = (process.env.NEXT_PUBLIC_CLOUDINARY_BASE || DEFAULT_CLOUDINARY_BASE).replace(/\/$/, "")
  const normalizedPath = value.replace(/^\/+/, "")
  return `${base}/${encodeURI(normalizedPath)}`
}
