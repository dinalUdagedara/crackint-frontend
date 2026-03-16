import axios, { type AxiosInstance } from "axios"
import type { ApiResponse, CVScorePayload } from "@/types/api.types"

export class CVScoringError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "CVScoringError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    const status = e.response.status
    const msg =
      status === 503
        ? "CV scoring is temporarily unavailable. Please try again later."
        : status === 400 || status === 404
          ? d.message ?? "This resume has no text to analyze. Use the file upload option instead."
          : d.message ?? `Request failed with status ${status}`
    throw new CVScoringError(msg, status, d.payload)
  }
  throw e
}

/** Score a CV from file upload (PDF or image). Backend passes to LLM vision.
 * If resumeId is provided and the resume is owned by the user, the score is saved on that resume. */
export async function scoreResumeFromFile(
  axiosAuth: AxiosInstance,
  file: File,
  resumeId?: string
): Promise<ApiResponse<CVScorePayload>> {
  const isSupported =
    file.type === "application/pdf" || file.type.startsWith("image/")
  if (!isSupported) {
    throw new CVScoringError(
      "Only PDF and image files (PNG, JPEG, WebP) are supported."
    )
  }
  const formData = new FormData()
  formData.append("file", file)
  const url = resumeId
    ? `/resumes/score?resume_id=${encodeURIComponent(resumeId)}`
    : "/resumes/score"
  try {
    const { data } = await axiosAuth.post<ApiResponse<CVScorePayload>>(
      url,
      formData,
      { headers: { "Content-Type": undefined } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Options for getResumeScore. */
export interface GetResumeScoreOptions {
  /** If true, backend re-runs the LLM and overwrites the stored score. */
  force?: boolean
}

/** Score an existing resume using stored raw text. Requires resume to have raw_text.
 * By default returns cached score if present; pass force: true to re-run the LLM and re-score. */
export async function getResumeScore(
  axiosAuth: AxiosInstance,
  resumeId: string,
  options?: GetResumeScoreOptions
): Promise<ApiResponse<CVScorePayload>> {
  try {
    const params = new URLSearchParams()
    if (options?.force) params.set("force", "true")
    const qs = params.toString()
    const url = `/resumes/${resumeId}/score${qs ? `?${qs}` : ""}`
    const { data } = await axiosAuth.get<ApiResponse<CVScorePayload>>(url)
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
