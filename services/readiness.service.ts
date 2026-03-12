import axios, { type AxiosInstance } from "axios"
import type {
  ApiResponse,
  ReadinessPayload,
  ReadinessSummaryResponse,
  ReadinessTrendItem,
} from "@/types/api.types"
import { SessionsError } from "./sessions.service"

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new SessionsError(
      d.message ?? `Request failed with status ${e.response.status}`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

export interface ReadinessParams {
  resume_id?: string
  job_posting_id?: string
}

export interface ReadinessSummaryParams extends ReadinessParams {
  last_n_sessions?: number
}

export interface ReadinessTrendParams {
  limit?: number
}

export async function getReadiness(
  axiosAuth: AxiosInstance,
  params?: ReadinessParams
): Promise<ApiResponse<ReadinessPayload>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<ReadinessPayload>>(
      "/users/me/readiness",
      { params }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function getReadinessSummary(
  axiosAuth: AxiosInstance,
  params?: ReadinessSummaryParams
): Promise<ApiResponse<ReadinessSummaryResponse>> {
  try {
    const { data } =
      await axiosAuth.get<ApiResponse<ReadinessSummaryResponse>>(
        "/users/me/readiness/summary",
        { params }
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function getReadinessTrend(
  axiosAuth: AxiosInstance,
  params?: ReadinessTrendParams
): Promise<ApiResponse<ReadinessTrendItem[]>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<ReadinessTrendItem[]>>(
      "/users/me/readiness/trend",
      { params }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
