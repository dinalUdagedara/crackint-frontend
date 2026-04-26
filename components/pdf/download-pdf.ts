import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import { sanitizeFilenameBase } from "./sanitize-filename"

/**
 * Renders a React-PDF document to a Blob and triggers a browser download.
 * Dynamically imports `@react-pdf/renderer` so it is not loaded until first use.
 */
export async function downloadPdfDocument(
  docElement: ReactElement<DocumentProps>,
  filename: string
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer")
  const blob = await pdf(docElement).toBlob()
  const url = URL.createObjectURL(blob)
  const safe =
    filename.endsWith(".pdf") ? filename : `${sanitizeFilenameBase(filename)}.pdf`
  const a = globalThis.document.createElement("a")
  a.href = url
  a.download = safe
  a.rel = "noopener"
  globalThis.document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Filename base like `crackint-match-JobTitle-2025-03-24` (caller adds context). */
export function buildPdfFilenameBase(prefix: string, label: string, isoDate?: string): string {
  const date =
    isoDate != null
      ? (() => {
          try {
            return new Date(isoDate).toISOString().slice(0, 10)
          } catch {
            return ""
          }
        })()
      : new Date().toISOString().slice(0, 10)
  const part = sanitizeFilenameBase(label)
  return `${prefix}-${part}-${date}`
}
