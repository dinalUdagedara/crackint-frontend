import type { ApiResponse, ResumeExtractPayload } from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const RESUMES_EXTRACT_URL = `${API_BASE}/api/v1/resumes/extract`

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
): Promise<ApiResponse<ResumeExtractPayload>> {
  if (file.type !== "application/pdf") {
    throw new ResumeUploadError(
      "Only PDF files are supported for upload. Please paste your CV text instead."
    )
  }

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(RESUMES_EXTRACT_URL, {
    method: "POST",
    body: formData,
  })

  return parseResponse<ResumeExtractPayload>(res)
}

/** Extract resume entities from raw text. */
export async function extractResumeFromText(
  text: string
): Promise<ApiResponse<ResumeExtractPayload>> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new ResumeUploadError("Please enter some CV text to extract.")
  }

  const formData = new FormData()
  formData.append("text", trimmed)

  const res = await fetch(RESUMES_EXTRACT_URL, {
    method: "POST",
    body: formData,
  })

  return parseResponse<ResumeExtractPayload>(res)
}
