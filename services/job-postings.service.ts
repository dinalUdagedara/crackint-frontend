import type {
  ApiResponse,
  JobPosting,
  JobPostingCreate,
  JobPostingListPayload,
} from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const JOB_POSTINGS_BASE = `${API_BASE}/api/v1/job-postings`

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

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    throw new JobPostingsError(
      data.message ?? `Request failed with status ${res.status}`,
      res.status,
      data.payload
    )
  }
  return data
}

export async function listJobPostings(
  page = 1,
  pageSize = 20,
  userId?: string
): Promise<ApiResponse<JobPostingListPayload>> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("page_size", String(pageSize))
  if (userId) params.set("user_id", userId)

  const res = await fetch(`${JOB_POSTINGS_BASE}?${params.toString()}`)
  return parseResponse<JobPostingListPayload>(res)
}

export async function getJobPosting(
  id: string
): Promise<ApiResponse<JobPosting>> {
  const res = await fetch(`${JOB_POSTINGS_BASE}/${id}`)
  return parseResponse<JobPosting>(res)
}

export async function createJobPosting(
  body: JobPostingCreate
): Promise<ApiResponse<JobPosting>> {
  const res = await fetch(JOB_POSTINGS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<JobPosting>(res)
}

