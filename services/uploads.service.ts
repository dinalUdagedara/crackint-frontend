import axios, { type AxiosInstance } from "axios"
import type { ApiResponse } from "@/types/api.types"

export class UploadError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "UploadError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new UploadError(
      d.message ?? `Upload failed (${e.response.status})`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

/**
 * Upload an image file to the backend (S3). Returns the public URL to store in cover_image_url.
 * Backend: POST /api/v1/uploads/image, multipart/form-data field "file", JPEG/PNG/WebP.
 */
export async function uploadCoverImage(
  axiosAuth: AxiosInstance,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError(
      "Please choose a JPEG, PNG, or WebP image."
    )
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadError(
      `Image must be under ${MAX_SIZE_MB} MB.`
    )
  }

  const formData = new FormData()
  formData.append("file", file)

  try {
    const { data } = await axiosAuth.post<
      ApiResponse<{ url: string }>
    >("/uploads/image", formData, {
      headers: { "Content-Type": undefined },
      timeout: 60000,
    })
    if (!data.success || !data.payload?.url) {
      throw new UploadError(
        (data as ApiResponse<unknown>).message ?? "Upload failed."
      )
    }
    return data.payload.url
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
