import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTR(
  date: Date | string,
  format: "full" | "short" | "month-year" | "compact" | "day-month" | "minimal" | "datetime" | "datetime-compact" | "datetime-minimal" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date
  switch (format) {
    case "full":
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long", year: "numeric" })
    case "month-year":
      return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    case "compact":
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
    case "day-month":
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
    case "minimal":
      return d.toLocaleDateString("tr-TR")
    case "datetime":
      return d.toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    case "datetime-compact":
      return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    case "datetime-minimal":
      return d.toLocaleString("tr-TR")
    case "short":
    default:
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
  }
}

export function sanitizeExternalUrl(rawUrl?: string | null): string | null {
  const value = (rawUrl || "").trim()
  if (!value) return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}
