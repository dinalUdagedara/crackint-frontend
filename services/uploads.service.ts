import axios, { type AxiosInstance } from "axios"
import { getAxiosErrorMessage } from "@/lib/axios-error-message"
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
      getAxiosErrorMessage(e, d.message ?? `Upload failed (${e.response.status})`),
      e.response.status,
      d.payload
    )
  }
  throw e
}

/** `cover` = job cover images; `profile` = user avatars (S3 prefix uploads/profile-images). */
export type ImageUploadPurpose = "cover" | "profile"
/** `resume` and `job` are for source document persistence. */
export type DocumentUploadPurpose = "resume" | "job"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

/**
 * Upload an image to S3 via the backend. Use `purpose`: `cover` (job images) or `profile` (avatars).
 * Backend: POST /api/v1/uploads/image?purpose=…, field `file`, JPEG/PNG/WebP.
 */
export async function uploadImage(
  axiosAuth: AxiosInstance,
  file: File,
  purpose: ImageUploadPurpose = "cover"
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
      params: { purpose },
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

/** Job posting cover image → store URL on `cover_image_url`. */
export async function uploadCoverImage(
  axiosAuth: AxiosInstance,
  file: File
): Promise<string> {
  return uploadImage(axiosAuth, file, "cover")
}

/** Profile avatar → PATCH /auth/me with `profile_image_url`. */
export async function uploadProfileImage(
  axiosAuth: AxiosInstance,
  file: File
): Promise<string> {
  return uploadImage(axiosAuth, file, "profile")
}

/**
 * Upload a source document manually and get its S3 URL.
 * Backend: POST /uploads/document?purpose=resume|job, multipart field `file`.
 */
export async function uploadDocument(
  axiosAuth: AxiosInstance,
  file: File,
  purpose: DocumentUploadPurpose
): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const { data } = await axiosAuth.post<
      ApiResponse<{ url: string }>
    >("/uploads/document", formData, {
      params: { purpose },
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
