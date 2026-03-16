import axios, { type AxiosInstance } from "axios"
import type { ApiResponse, SkillGapPayload } from "@/types/api.types"

export class MatchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "MatchError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    const status = e.response.status
    const msg =
      status === 404
        ? "Resume or job posting not found."
        : d.message ?? `Request failed with status ${status}`
    throw new MatchError(msg, status, d.payload)
  }
  throw e
}

/** Run skill-gap analysis (POST). Computes, persists, and returns result. Use for first run or force refresh. */
export async function runSkillGapAnalysis(
  axiosAuth: AxiosInstance,
  resumeId: string,
  jobPostingId: string,
  options?: { use_llm?: boolean }
): Promise<ApiResponse<SkillGapPayload>> {
  try {
    const params =
      options?.use_llm === true ? new URLSearchParams({ use_llm: "true" }) : undefined
    const { data } = await axiosAuth.post<ApiResponse<SkillGapPayload>>(
      `/match/skill-gap${params ? `?${params.toString()}` : ""}`,
      { resume_id: resumeId, job_posting_id: jobPostingId }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Get stored skill-gap analysis (GET). Returns last saved result; 404 if none. No LLM call. */
export async function getStoredSkillGap(
  axiosAuth: AxiosInstance,
  resumeId: string,
  jobPostingId: string
): Promise<ApiResponse<SkillGapPayload>> {
  try {
    const params = new URLSearchParams({
      resume_id: resumeId,
      job_posting_id: jobPostingId,
    })
    const { data } = await axiosAuth.get<ApiResponse<SkillGapPayload>>(
      `/match/skill-gap?${params.toString()}`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
