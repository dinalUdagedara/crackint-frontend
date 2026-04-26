import { getResumeOrJobUploadFileError } from "@/lib/upload-file-validation"
import type { ApiResponse } from "@/types/api.types"
import type { JobExtractPayload } from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const JOBS_BASE = `${API_BASE}/api/v1/jobs`

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

/** Extract job entities from a PDF, Word (.docx), or image file. See `upload-file-validation`. */
export async function extractJobFromFile(
  file: File,
  useValidation = false
): Promise<ApiResponse<JobExtractPayload>> {
  const typeErr = getResumeOrJobUploadFileError(file)
  if (typeErr) {
    throw new JobExtractError(typeErr)
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
