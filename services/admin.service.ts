import axios, { type AxiosInstance } from "axios"
import { getAxiosErrorMessage } from "@/lib/axios-error-message"
import type {
  ApiResponse,
  AdminSessionListPayload,
  AdminUserDeletePayload,
  AdminUserListPayload,
  AdminUserUpdateBody,
  AdminUserListItem,
} from "@/types/api.types"

export class AdminError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = "AdminError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    throw new AdminError(
      getAxiosErrorMessage(e, `Request failed with status ${e.response.status}`),
      e.response.status
    )
  }
  throw e
}

export async function listAdminUsers(
  axiosAuth: AxiosInstance,
  page = 1,
  pageSize = 20,
  search?: string
): Promise<ApiResponse<AdminUserListPayload>> {
  try {
    const params: {
      page: number
      page_size: number
      search?: string
    } = { page, page_size: pageSize }
    if (search?.trim()) params.search = search.trim()
    const { data } = await axiosAuth.get<ApiResponse<AdminUserListPayload>>(
      "/admin/users",
      { params }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function patchAdminUser(
  axiosAuth: AxiosInstance,
  userId: string,
  body: AdminUserUpdateBody
): Promise<ApiResponse<AdminUserListItem>> {
  try {
    const { data } = await axiosAuth.patch<ApiResponse<AdminUserListItem>>(
      `/admin/users/${userId}`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function deleteAdminUser(
  axiosAuth: AxiosInstance,
  userId: string
): Promise<ApiResponse<AdminUserDeletePayload>> {
  try {
    const { data } = await axiosAuth.delete<
      ApiResponse<AdminUserDeletePayload>
    >(`/admin/users/${userId}`)
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export type AdminSessionsQuery = {
  page?: number
  page_size?: number
  status?: "ACTIVE" | "COMPLETED"
  user_id?: string
}

export async function listAdminSessions(
  axiosAuth: AxiosInstance,
  query: AdminSessionsQuery = {}
): Promise<ApiResponse<AdminSessionListPayload>> {
  try {
    const page = query.page ?? 1
    const page_size = query.page_size ?? 20
    const params: Record<string, string | number> = { page, page_size }
    if (query.status) params.status = query.status
    if (query.user_id?.trim()) params.user_id = query.user_id.trim()
    const { data } = await axiosAuth.get<ApiResponse<AdminSessionListPayload>>(
      "/admin/sessions",
      { params }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
