"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"
import { axiosAuth } from "@/lib/axios"
import { handle401 } from "@/lib/api-client"

/**
 * In client components, registers request (inject Bearer token) and response (on 401: signOut + redirect) interceptors on axiosAuth, then returns that same instance.
 * Only triggers handle401() when status === "authenticated" so we don't sign out on 401s that happen because the session was still loading (request sent without token).
 * No refresh (backend has no refresh endpoint). Clean up interceptors on unmount.
 */
export function useAxiosAuth(): AxiosInstance {
  const { data: session, status } = useSession()
  const accessToken = session?.accessToken as string | undefined

  useEffect(() => {
    const requestInterceptor = axiosAuth.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (accessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
      }
    )

    const responseInterceptor = axiosAuth.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && status === "authenticated") {
          handle401()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axiosAuth.interceptors.request.eject(requestInterceptor)
      axiosAuth.interceptors.response.eject(responseInterceptor)
    }
  }, [accessToken, status])

  return axiosAuth
}
