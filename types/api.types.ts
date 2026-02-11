export interface PaginationMeta {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

export interface ApiResponse<T> {
  message: string;
  success: boolean;
  payload: T | null;
  meta?: PaginationMeta | null;
}

/** Resume entity keys from POST /api/v1/resumes/extract */
export type ResumeEntityKey =
  | "NAME"
  | "EMAIL"
  | "SKILL"
  | "OCCUPATION"
  | "EDUCATION"
  | "EXPERIENCE";

export interface ResumeExtractPayload {
  entities: Record<string, string[]>;
  raw_text: string | null;
}

/** Full resume from API (persisted) */
export interface Resume {
  id: string;
  user_id: string | null;
  entities: Record<string, string[]>;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload from POST extract - may include id if persisted */
export type ResumeExtractResult = ResumeExtractPayload & Partial<Pick<Resume, "id" | "user_id" | "created_at" | "updated_at">>;

/** Response payload for GET /resumes - array of resumes */
export type ResumeListPayload = Resume[];

/** Payload from POST /api/v1/jobs/extract. Entity keys vary (job NER or resume fallback). */
export interface JobExtractPayload {
  entities: Record<string, string[]>;
  raw_text: string | null;
}
