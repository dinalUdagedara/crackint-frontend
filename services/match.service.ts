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

/** Compare resume vs job posting; return missing skills, weak areas, suggestions, alerts. */
export async function getSkillGap(
  axiosAuth: AxiosInstance,
  resumeId: string,
  jobPostingId: string
): Promise<ApiResponse<SkillGapPayload>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<SkillGapPayload>>(
      "/match/skill-gap",
      { resume_id: resumeId, job_posting_id: jobPostingId }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
