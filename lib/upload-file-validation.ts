/**
 * Aligns with backend `docs/DOCX_UPLOAD.md`: PDF, images, and Word OOXML (.docx).
 * Legacy .doc is not supported. Rejects .docx filename with image/* or application/pdf MIME.
 */

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const CONFLICT_MSG =
  "This file’s name suggests Word (.docx), but the browser reports a PDF or image type. Try re-exporting the document or use paste text."

const UNSUPPORTED_MSG =
  "Please upload PDF, Word (.docx), or images (PNG, JPEG, WebP). Legacy .doc is not supported."

export function hasDocxExtension(file: File): boolean {
  return file.name.toLowerCase().endsWith(".docx")
}

/** Backend rejects conflicting signals: .docx extension with image/* or application/pdf. */
export function isDocxConflictMime(file: File): boolean {
  return (
    hasDocxExtension(file) &&
    (file.type.startsWith("image/") || file.type === "application/pdf")
  )
}

export function isAllowedResumeOrJobUploadFile(file: File): boolean {
  if (isDocxConflictMime(file)) return false
  if (file.type === "application/pdf") return true
  if (file.type.startsWith("image/")) return true
  if (file.type === DOCX_MIME) return true
  if (hasDocxExtension(file)) return true
  return false
}

/** `null` if the file is allowed; otherwise a user-facing error string. */
export function getResumeOrJobUploadFileError(file: File): string | null {
  if (isDocxConflictMime(file)) return CONFLICT_MSG
  if (isAllowedResumeOrJobUploadFile(file)) return null
  return UNSUPPORTED_MSG
}
