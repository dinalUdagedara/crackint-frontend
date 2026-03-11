import axios, { type AxiosInstance } from "axios"
import type {
  ApiResponse,
  CoverLetter,
  CoverLetterDeletePayload,
  GenerateCoverLetterBody,
  UpdateCoverLetterBody,
} from "@/types/api.types"

export class CoverLetterError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "CoverLetterError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new CoverLetterError(
      d.message ?? `Request failed with status ${e.response.status}`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

export async function generateCoverLetter(
  axiosAuth: AxiosInstance,
  body: GenerateCoverLetterBody
): Promise<ApiResponse<CoverLetter>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<CoverLetter>>(
      "/cover-letter/generate",
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function getCoverLetter(
  axiosAuth: AxiosInstance,
  resumeId: string,
  jobPostingId: string
): Promise<ApiResponse<CoverLetter>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<CoverLetter>>(
      "/cover-letter",
      {
        params: {
          resume_id: resumeId,
          job_posting_id: jobPostingId,
        },
      }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function updateCoverLetter(
  axiosAuth: AxiosInstance,
  id: string,
  body: UpdateCoverLetterBody
): Promise<ApiResponse<CoverLetter>> {
  try {
    const { data } = await axiosAuth.put<ApiResponse<CoverLetter>>(
      `/cover-letter/${id}`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function deleteCoverLetter(
  axiosAuth: AxiosInstance,
  resumeId: string,
  jobPostingId: string
): Promise<ApiResponse<CoverLetterDeletePayload>> {
  try {
    const { data } = await axiosAuth.delete<ApiResponse<CoverLetterDeletePayload>>(
      "/cover-letter",
      {
        params: {
          resume_id: resumeId,
          job_posting_id: jobPostingId,
        },
      }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

