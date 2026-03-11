"use client"

import { useCallback } from "react"
import { useSession, signOut } from "next-auth/react"

/**
 * Returns an auth-aware fetch function that:
 * - Adds Authorization: Bearer <accessToken> to every request
 * - On 401 response: signs out and redirects to /login (no token refresh; backend has no refresh endpoint)
 */
export function useAuthFetch() {
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken as string | undefined

  const authFetch = useCallback<typeof fetch>(
    async (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : (input as URL).href
      const headers = new Headers(init.headers)
      if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`)
      }
      const res = await fetch(input, { ...init, headers })
      if (res.status === 401) {
        if (status === "authenticated") {
          await signOut({ callbackUrl: "/login", redirect: true })
        }
        return res
      }
      return res
    },
    [accessToken, status]
  )

  return {
    authFetch,
    accessToken,
    isAuthenticated: status === "authenticated",
  }
}
