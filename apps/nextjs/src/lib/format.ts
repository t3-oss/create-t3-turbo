/**
 * Formatting utilities — shared across all pages.
 *
 * Import: import { formatDate, formatCurrency, ... } from "~/lib/format";
 */

/**
 * Format a date for display. Uses the user's locale by default.
 *
 * formatDate(new Date()) → "Feb 27, 2026"
 * formatDate(new Date(), { relative: true }) → "2 hours ago"
 */
export function formatDate(
  date: Date | string | number,
  options?: { relative?: boolean; locale?: string },
): string {
  const d = new Date(date);
  const locale = options?.locale ?? "en-US";

  if (options?.relative) {
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a number as currency.
 *
 * formatCurrency(1999) → "$19.99" (cents to dollars)
 * formatCurrency(1999, { currency: "EUR" }) → "€19.99"
 */
export function formatCurrency(
  cents: number,
  options?: { currency?: string; locale?: string },
): string {
  const currency = options?.currency ?? "USD";
  const locale = options?.locale ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Format a large number compactly.
 *
 * formatNumber(1234) → "1.2K"
 * formatNumber(1234567) → "1.2M"
 */
export function formatNumber(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(n);
}

/**
 * Truncate a string with ellipsis.
 *
 * truncate("Hello World", 5) → "Hello..."
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Format file size in human-readable format.
 *
 * formatBytes(1024) → "1.0 KB"
 * formatBytes(1048576) → "1.0 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}
