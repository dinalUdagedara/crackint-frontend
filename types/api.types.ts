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
