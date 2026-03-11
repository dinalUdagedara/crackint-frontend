import axios, { type AxiosInstance } from "axios"
import type {
  ApiResponse,
  Resume,
  ResumeExtractResult,
  ResumeListPayload,
} from "@/types/api.types"

export class ResumeUploadError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "ResumeUploadError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new ResumeUploadError(
      d.message ?? `Request failed with status ${e.response.status}`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

/** Extract resume entities from a PDF or image file. Backend accepts PDF and images (PNG, JPEG, WebP). */
export async function extractResumeFromFile(
  axiosAuth: AxiosInstance,
  file: File,
  useEnhancedExtraction = false
): Promise<ApiResponse<ResumeExtractResult>> {
  const isSupported =
    file.type === "application/pdf" || file.type.startsWith("image/")
  if (!isSupported) {
    throw new ResumeUploadError(
      "Only PDF and image files (PNG, JPEG, WebP) are supported. Please paste your CV text instead."
    )
  }
  const formData = new FormData()
  formData.append("file", file)
  const url = `/resumes/extract${useEnhancedExtraction ? "?validate=true" : ""}`
  try {
    const { data } = await axiosAuth.post<ApiResponse<ResumeExtractResult>>(
      url,
      formData,
      { headers: { "Content-Type": undefined } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Extract resume entities from raw text. */
export async function extractResumeFromText(
  axiosAuth: AxiosInstance,
  text: string,
  useEnhancedExtraction = false
): Promise<ApiResponse<ResumeExtractResult>> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new ResumeUploadError("Please enter some CV text to extract.")
  }
  const formData = new FormData()
  formData.append("text", trimmed)
  const url = `/resumes/extract${useEnhancedExtraction ? "?validate=true" : ""}`
  try {
    const { data } = await axiosAuth.post<ApiResponse<ResumeExtractResult>>(
      url,
      formData,
      {
        headers: { "Content-Type": undefined },
      }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Update resume entity fields (PATCH). */
export async function updateResumeEntities(
  axiosAuth: AxiosInstance,
  resumeId: string,
  entities: Record<string, string[]>
): Promise<ApiResponse<Resume>> {
  try {
    const { data } = await axiosAuth.patch<ApiResponse<Resume>>(
      `/resumes/${resumeId}`,
      { entities }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Get a single resume by ID (scoped to authenticated user). */
export async function getResume(
  axiosAuth: AxiosInstance,
  resumeId: string
): Promise<ApiResponse<Resume>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<Resume>>(
      `/resumes/${resumeId}`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** List all resumes with pagination (scoped to authenticated user). */
export async function listResumes(
  axiosAuth: AxiosInstance,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<ResumeListPayload>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<ResumeListPayload>>(
      "/resumes",
      { params: { page, page_size: pageSize } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Delete a single resume by ID (scoped to authenticated user). */
export async function deleteResume(
  axiosAuth: AxiosInstance,
  resumeId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const { data } =
      await axiosAuth.delete<ApiResponse<{ deleted: boolean }>>(
        `/resumes/${resumeId}`
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Delete all resumes (scoped to authenticated user). */
export async function deleteAllResumes(
  axiosAuth: AxiosInstance
): Promise<ApiResponse<{ deleted_count: number }>> {
  try {
    const { data } =
      await axiosAuth.delete<ApiResponse<{ deleted_count: number }>>(
        "/resumes"
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
