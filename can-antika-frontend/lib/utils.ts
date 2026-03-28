import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTR(
  date: Date | string,
  format: "full" | "short" | "month-year" | "compact" | "day-month" | "minimal" | "datetime" | "datetime-compact" | "datetime-minimal" | "time" = "short"
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
    case "time":
      return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    case "short":
    default:
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
  }
}

/**
 * Safely extract a user-friendly error message from an unknown catch value.
 * Never leaks stack traces or internal details to the UI.
 */
export function getErrorMessage(error: unknown, fallback = "Bir hata oluştu"): string {
  if (error instanceof Error) {
    // Strip anything that looks like a stack trace or internal path
    const msg = error.message
    if (msg.length > 200 || msg.includes("\n") || msg.includes("at ")) return fallback
    return msg
  }
  if (typeof error === "string" && error.length <= 200) return error
  return fallback
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
