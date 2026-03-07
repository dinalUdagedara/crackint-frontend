import axios, { type AxiosInstance } from "axios"
import type {
  ApiResponse,
  JobPosting,
  JobPostingCreate,
  JobPostingListPayload,
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
