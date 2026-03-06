import type { ApiResponse, LoginBody, LoginPayload, RegisterBody, User } from "@/types/api.types"
import { handle401 } from "@/lib/api-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const AUTH_BASE = `${API_BASE}/api/v1/auth`

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T> & { detail?: string | unknown }
  if (!res.ok) {
    if (res.status === 401) handle401()
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? (data.detail as { msg?: string }[])[0]?.msg ?? data.message ?? "Request failed"
          : data.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }
  return data as ApiResponse<T>
}

export async function register(
  body: RegisterBody
): Promise<ApiResponse<User>> {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<User>(res)
}

export async function login(body: LoginBody): Promise<ApiResponse<LoginPayload>> {
  const url = `${AUTH_BASE}/login`
  console.log("[auth] login: POST", url, "email:", body.email)
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json()) as ApiResponse<LoginPayload> & { detail?: string | unknown }
    console.log("[auth] login: backend responded", res.status, data.message ?? data.detail)
    // Do not call handle401() here: 401 on login means wrong credentials, not session expiry.
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? (data.detail as { msg?: string }[])[0]?.msg ?? data.message ?? "Request failed"
          : data.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }
  const data = await parseResponse<LoginPayload>(res)
  console.log("[auth] login: success, payload present:", !!data.payload)
  return data
}

export async function getMe(accessToken: string): Promise<ApiResponse<User>> {
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return parseResponse<User>(res)
}
