import axios, { type AxiosInstance } from "axios"
import { getAxiosErrorMessage } from "@/lib/axios-error-message"
import { getResumeOrJobUploadFileError } from "@/lib/upload-file-validation"
import type { ApiResponse } from "@/types/api.types"
import type { JobExtractPayload } from "@/types/api.types"

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

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new JobExtractError(
      getAxiosErrorMessage(e, `Request failed with status ${e.response.status}`),
      e.response.status,
      d.payload
    )
  }
  throw e
}

async function postExtract(
  axiosAuth: AxiosInstance,
  formData: FormData,
  useValidation: boolean
): Promise<ApiResponse<JobExtractPayload>> {
  const url = `/jobs/extract${useValidation ? "?validate=true" : ""}`
  try {
    const { data } = await axiosAuth.post<ApiResponse<JobExtractPayload>>(
      url,
      formData,
      { headers: { "Content-Type": undefined } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

/** Extract job entities from a PDF, Word (.docx), or image file. See `upload-file-validation`. */
export async function extractJobFromFile(
  axiosAuth: AxiosInstance,
  file: File,
  useValidation = false
): Promise<ApiResponse<JobExtractPayload>> {
  const typeErr = getResumeOrJobUploadFileError(file)
  if (typeErr) {
    throw new JobExtractError(typeErr)
  }

  const formData = new FormData()
  formData.append("file", file)
  return postExtract(axiosAuth, formData, useValidation)
}

/** Extract job entities from raw text. */
export async function extractJobFromText(
  axiosAuth: AxiosInstance,
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
  return postExtract(axiosAuth, formData, useValidation)
}
