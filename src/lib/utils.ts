import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build a public URL for a file in Supabase Storage.
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * German "time ago" formatter.
 */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return "gerade eben"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `vor ${minutes} Min.`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`

  const days = Math.floor(hours / 24)
  if (days < 30) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`

  const months = Math.floor(days / 30)
  if (months < 12) return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`

  const years = Math.floor(months / 12)
  return `vor ${years} ${years === 1 ? "Jahr" : "Jahren"}`
}

/**
 * German "time remaining" formatter for reservation expiry.
 */
export function timeRemaining(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const seconds = Math.max(0, Math.floor((then - now) / 1000))

  if (seconds === 0) return "abgelaufen"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) return `noch ${hours} Std. ${minutes} Min.`
  return `noch ${minutes} Min.`
}

/**
 * Format phone number as WhatsApp link.
 */
export function whatsappUrl(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "")
  // Convert German local format to international
  const international = cleaned.startsWith("0")
    ? "+49" + cleaned.slice(1)
    : cleaned
  return `https://wa.me/${international.replace("+", "")}`
}

/**
 * German pricing label for display.
 */
export function pricingLabel(type: string, detail?: string | null): string {
  switch (type) {
    case "free":
      return "Zu verschenken"
    case "lending":
      return "Zum Verleihen"
    case "other":
      return detail || "Preis auf Anfrage"
    default:
      return type
  }
}
