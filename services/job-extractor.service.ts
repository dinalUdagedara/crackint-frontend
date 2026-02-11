import type { ApiResponse } from "@/types/api.types"
import type { JobExtractPayload } from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const JOBS_BASE = `${API_BASE}/api/v1/jobs`

const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]

export class JobExtractError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "JobExtractError"
  }
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    throw new JobExtractError(
      data.message ?? `Request failed with status ${res.status}`,
      res.status,
      data.payload
    )
  }
  return data
}

function isSupportedFileType(file: File): boolean {
  return SUPPORTED_FILE_TYPES.includes(file.type)
}

/** Extract job entities from a PDF or image file. Backend accepts PDF and images (PNG, JPEG, WebP). */
export async function extractJobFromFile(
  file: File,
  useValidation = false
): Promise<ApiResponse<JobExtractPayload>> {
  if (!isSupportedFileType(file)) {
    throw new JobExtractError(
      "Only PDF and image files (PNG, JPEG, WebP) are supported. Please paste job description text instead."
    )
  }

  const formData = new FormData()
  formData.append("file", file)

  const url = `${JOBS_BASE}/extract${useValidation ? "?validate=true" : ""}`
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  })

  return parseResponse<JobExtractPayload>(res)
}

/** Extract job entities from raw text. */
export async function extractJobFromText(
  text: string,
  useValidation = false
): Promise<ApiResponse<JobExtractPayload>> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new JobExtractError(
      "Please enter some job description text to extract."
    )
  }

  const formData = new FormData()
  formData.append("text", trimmed)

  const url = `${JOBS_BASE}/extract${useValidation ? "?validate=true" : ""}`
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  })

  return parseResponse<JobExtractPayload>(res)
}
