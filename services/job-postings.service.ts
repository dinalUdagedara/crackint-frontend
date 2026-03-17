import axios, { type AxiosInstance } from "axios"
import type {
  ApiResponse,
  JobPosting,
  JobPostingCreate,
  JobPostingListPayload,
  JobPostingUpdate,
  NearDeadlinePayload,
} from "@/types/api.types"

export class JobPostingsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "JobPostingsError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new JobPostingsError(
      d.message ?? `Request failed with status ${e.response.status}`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

export async function listJobPostings(
  axiosAuth: AxiosInstance,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<JobPostingListPayload>> {
  try {
    const { data } =
      await axiosAuth.get<ApiResponse<JobPostingListPayload>>(
        "/job-postings",
        { params: { page, page_size: pageSize } }
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function getJobPosting(
  axiosAuth: AxiosInstance,
  id: string
): Promise<ApiResponse<JobPosting>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<JobPosting>>(
      `/job-postings/${id}`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function createJobPosting(
  axiosAuth: AxiosInstance,
  body: JobPostingCreate
): Promise<ApiResponse<JobPosting>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<JobPosting>>(
      "/job-postings",
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function updateJobPosting(
  axiosAuth: AxiosInstance,
  id: string,
  body: JobPostingUpdate
): Promise<ApiResponse<JobPosting>> {
  try {
    const { data } = await axiosAuth.patch<ApiResponse<JobPosting>>(
      `/job-postings/${id}`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Delete a single job posting by ID (scoped to authenticated user). */
export async function deleteJobPosting(
  axiosAuth: AxiosInstance,
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const { data } =
      await axiosAuth.delete<ApiResponse<{ deleted: boolean }>>(
        `/job-postings/${id}`
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Bulk reorder job postings by ID array (order of array = display_order 0, 1, 2, …). */
export async function reorderJobPostings(
  axiosAuth: AxiosInstance,
  order: string[]
): Promise<ApiResponse<{ updated?: boolean }>> {
  try {
    const { data } = await axiosAuth.put<ApiResponse<{ updated?: boolean }>>(
      "/job-postings/reorder",
      { order }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Job postings with deadline or interview in the next N days (default 7, max 90). Sorted soonest first. */
export async function getNearDeadlineJobPostings(
  axiosAuth: AxiosInstance,
  days = 7
): Promise<ApiResponse<NearDeadlinePayload>> {
  const clamped = Math.min(90, Math.max(1, days))
  try {
    const { data } = await axiosAuth.get<ApiResponse<NearDeadlinePayload>>(
      "/job-postings/near-deadline",
      { params: { days: clamped } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
