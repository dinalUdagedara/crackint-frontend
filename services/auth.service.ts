import type { ApiResponse, LoginBody, LoginPayload, RegisterBody, User } from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const AUTH_BASE = `${API_BASE}/api/v1/auth`

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T> & { detail?: string | unknown }
  if (!res.ok) {
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
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<LoginPayload>(res)
}

export async function getMe(accessToken: string): Promise<ApiResponse<User>> {
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return parseResponse<User>(res)
}
