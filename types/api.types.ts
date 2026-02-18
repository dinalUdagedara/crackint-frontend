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

// ---- Job postings ----

export interface JobPosting {
  id: string;
  user_id: string | null;
  entities: Record<string, string[]>;
  raw_text: string | null;
  location: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export type JobPostingListPayload = JobPosting[];

export interface JobPostingCreate {
  user_id: string | null;
  entities: Record<string, string[]>;
  raw_text: string | null;
  location: string | null;
  deadline: string | null;
}

// ---- Prep sessions & messages ----

export type PrepSessionMode = "TARGETED" | "QUICK_PRACTICE";

export type PrepSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface PrepSessionSummary {
  // Kept generic for now; backend can shape this later
  [key: string]: unknown;
}

export interface PrepSession {
  id: string;
  user_id: string | null;
  resume_id: string | null;
  job_posting_id: string | null;
  mode: PrepSessionMode;
  status: PrepSessionStatus;
  readiness_score: number | null;
  summary: PrepSessionSummary | null;
  created_at: string;
  updated_at: string;
}

export type PrepSessionListPayload = PrepSession[];

export interface PrepSessionCreate {
  user_id: string | null;
  resume_id: string | null;
  job_posting_id: string | null;
  mode: PrepSessionMode;
}

export type MessageSender = "USER" | "ASSISTANT";

export type MessageType = "QUESTION" | "ANSWER" | "FEEDBACK";

export interface MessageMetadata {
  [key: string]: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  metadata: MessageMetadata;
  created_at: string;
  updated_at: string;
}

export type MessageListPayload = Message[];

export interface MessageCreate {
  sender: MessageSender;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
}

export interface PrepSessionWithMessages extends PrepSession {
  messages: Message[];
}

// ---- Session Q&A (LLM) ----

export interface NextQuestionPayload {
  question: string;
  difficulty?: string | null;
  question_type?: string | null;
  message_id: string;
}

export interface EvaluateAnswerPayload {
  feedback: string;
  score: number | null;
  dimension_tags: string[] | null;
  message_id: string;
}

export interface SendReplyPayload {
  user_message_id: string;
  feedback: string | null;
  score: number | null;
  dimension_tags: string[] | null;
  message_id: string | null;
  redirect: boolean;
}

export interface ChatTurnPayload {
  new_messages: Message[];
}
