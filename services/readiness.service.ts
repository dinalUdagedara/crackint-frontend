import axios, { type AxiosInstance } from "axios"
import type { ApiResponse, ReadinessPayload } from "@/types/api.types"

/** Get combined readiness score (CV + sessions + gap) for current user. */
export async function getReadiness(
  axiosAuth: AxiosInstance,
  options?: { resumeId?: string; jobPostingId?: string }
): Promise<ApiResponse<ReadinessPayload>> {
  const params = new URLSearchParams()
  if (options?.resumeId) params.set("resume_id", options.resumeId)
  if (options?.jobPostingId) params.set("job_posting_id", options.jobPostingId)
  const query = params.toString()
  const url = query ? `/users/me/readiness?${query}` : "/users/me/readiness"
  const { data } = await axiosAuth.get<ApiResponse<ReadinessPayload>>(url)
  return data
}
