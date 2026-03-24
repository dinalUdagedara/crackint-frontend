/** ASCII-safe filename fragment for downloads (no path separators). */
export function sanitizeFilenameBase(name: string, maxLen = 80): string {
  const trimmed = name.trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-")
  const ascii = trimmed.replace(/[^\x20-\x7E]/g, "")
  const cut = ascii.slice(0, maxLen).replace(/-+$/, "")
  return cut || "export"
}
