/**
 * Base URL for the backend API (same as used in services).
 * Use with useAuthFetch() for authenticated requests.
 */
export const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : "http://localhost:8000"

export const API_V1 = `${API_BASE}/api/v1`

/** Fetch that includes Authorization and handles 401 (sign out + redirect). */
export type AuthFetch = (
  url: string | URL,
  init?: RequestInit
) => Promise<Response>

/** 401 handler: called when any API returns 401. Set by AuthProvider to sign out and redirect. */
let on401: (() => void) | null = null
export function set401Handler(handler: (() => void) | null) {
  on401 = handler
}
export function get401Handler(): (() => void) | null {
  return on401
}
/** Call from services when response status is 401. */
export function handle401() {
  on401?.()
}
