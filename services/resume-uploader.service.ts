import type {
  ApiResponse,
  Resume,
  ResumeExtractResult,
  ResumeListPayload,
} from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const RESUMES_BASE = `${API_BASE}/api/v1/resumes`

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

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    throw new ResumeUploadError(
      data.message ?? `Request failed with status ${res.status}`,
      res.status,
      data.payload
    )
  }
  return data
}

/** Extract resume entities from a PDF file. Backend accepts PDF only. */
export async function extractResumeFromFile(
  file: File
): Promise<ApiResponse<ResumeExtractResult>> {
  if (file.type !== "application/pdf") {
    throw new ResumeUploadError(
      "Only PDF files are supported for upload. Please paste your CV text instead."
    )
  }

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${RESUMES_BASE}/extract`, {
    method: "POST",
    body: formData,
  })

  return parseResponse<ResumeExtractResult>(res)
}

/** Extract resume entities from raw text. */
export async function extractResumeFromText(
  text: string
): Promise<ApiResponse<ResumeExtractResult>> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new ResumeUploadError("Please enter some CV text to extract.")
  }

  const formData = new FormData()
  formData.append("text", trimmed)

  const res = await fetch(`${RESUMES_BASE}/extract`, {
    method: "POST",
    body: formData,
  })

  return parseResponse<ResumeExtractResult>(res)
}

/** Update resume entity fields (PATCH). */
export async function updateResumeEntities(
  resumeId: string,
  entities: Record<string, string[]>
): Promise<ApiResponse<Resume>> {
  const res = await fetch(`${RESUMES_BASE}/${resumeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entities }),
  })
  return parseResponse<Resume>(res)
}

/** List all resumes with pagination. */
export async function listResumes(
  page = 1,
  pageSize = 20,
  userId?: string
): Promise<ApiResponse<ResumeListPayload>> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("page_size", String(pageSize))
  if (userId) params.set("user_id", userId)
  const res = await fetch(`${RESUMES_BASE}?${params}`)
  return parseResponse<ResumeListPayload>(res)
}

/** Delete all resumes. */
export async function deleteAllResumes(): Promise<
  ApiResponse<{ deleted_count: number }>
> {
  const res = await fetch(RESUMES_BASE, { method: "DELETE" })
  return parseResponse<{ deleted_count: number }>(res)
}
