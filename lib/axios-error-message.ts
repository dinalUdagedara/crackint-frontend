import axios from "axios"

/**
 * FastAPI often returns `{ detail: string | [...] }`; app handlers may use `message`.
 */
export function getAxiosErrorMessage(
  error: unknown,
  fallback = "Request failed"
): string {
  if (!axios.isAxiosError(error) || error.response?.data == null) {
    return error instanceof Error ? error.message : fallback
  }
  const data = error.response.data as {
    detail?: unknown
    message?: string
  }
  if (typeof data.detail === "string") return data.detail
  if (Array.isArray(data.detail)) {
    const first = (data.detail as { msg?: string }[])[0]?.msg
    if (first) return first
  }
  if (typeof data.message === "string" && data.message) return data.message
  return fallback
}
