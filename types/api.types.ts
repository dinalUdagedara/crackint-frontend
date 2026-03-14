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
  /** Latest CV score (0–100) if ever computed. */
  cv_score?: number | null;
  /** When the CV score was computed (ISO datetime). */
  cv_scored_at?: string | null;
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

/** Body for PATCH job posting: only provided fields are updated. */
export interface JobPostingUpdate {
  entities?: Record<string, string[]>;
  raw_text?: string | null;
  location?: string | null;
  deadline?: string | null;
}

// ---- Prep sessions & messages ----

export type PrepSessionMode = "TARGETED" | "QUICK_PRACTICE" | "TUTOR_CHAT";

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

export interface PrepSessionUpdate {
  title?: string;
  mode?: PrepSessionMode;
}

export type MessageSender = "USER" | "ASSISTANT";

export type MessageType = "QUESTION" | "ANSWER" | "FEEDBACK" | "COVER_LETTER";

export interface MessageMetadata {
  [key: string]: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  /** Frontend uses this; backend may return `meta` instead (v2 doc). */
  metadata: MessageMetadata;
  /** Backend API returns this (alias for metadata). Use metadata first, then meta. */
  meta?: Record<string, string | undefined>;
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

/** Role level for next-question (optional in body). */
export type RoleLevel = "INTERN" | "ASE" | "SSE" | "OTHER";

/** Override requested difficulty when a next question is generated (next-question, chat, send). */
export type PreferDifficulty = "easy" | "medium" | "hard";

/** Request body for POST /sessions/{id}/next-question. */
export interface NextQuestionRequest {
  question_type?: "technical" | "behavioral" | "system_design";
  role_level?: RoleLevel;
  prefer_difficulty?: PreferDifficulty;
}

export interface NextQuestionPayload {
  question: string;
  difficulty?: string | null;
  question_type?: string | null;
  message_id: string;
}

/** Request body for POST /sessions/{id}/chat and .../send. */
export interface ChatTurnRequest {
  content: string;
  prefer_difficulty?: PreferDifficulty;
}

export interface EvaluateAnswerPayload {
  feedback: string;
  score?: number | null;
  dimension_tags?: string[] | null;
  message_id: string;
  redirect?: boolean;
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

// ---- Auth (backend JWT) ----

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginPayload {
  access_token: string;
  token_type: "bearer";
  user: User;
}

// ---- CV Scoring ----

export interface CVScorePayload {
  score: number;
  /** content, structure, clarity (optional keys from backend). */
  breakdown: Record<string, number>;
  suggestions: string[];
  /** When this score was computed (ISO datetime). Present when score is stored. */
  scored_at?: string | null;
}

// ---- Skill-Gap ----

export interface SkillGapAlert {
  type: "missing_skill" | "weak_experience" | "weak_education";
  message: string;
  severity: "low" | "medium" | "high";
}

/** Optional LLM analysis when RESUME_JOB_FIT_LLM_ENABLED and both resume/job have raw_text. */
export interface ResumeJobFitAnalysis {
  fit_score: number; // 0–100
  summary: string;
  tailored_suggestions: string[];
}

export interface SkillGapPayload {
  missing_skills: string[];
  weak_experience: boolean;
  weak_experience_message: string | null;
  weak_education: boolean;
  weak_education_message: string | null;
  suggestions: string[];
  severity: "low" | "medium" | "high";
  alerts: SkillGapAlert[];
  /** Present when LLM is enabled and both resume and job have raw text. */
  llm_fit_analysis?: ResumeJobFitAnalysis | null;
  /** When the analysis was run (POST or GET). */
  analyzed_at?: string | null;
}

// ---- Readiness ----

export interface ReadinessPayload {
  combined_score: number;
  cv_score: number | null;
  session_avg: number | null;
  gap_severity: "low" | "medium" | "high" | null;
  trend: "improving" | "stable" | "declining";
}

export type ReadinessTrend = "improving" | "stable" | "declining";

export interface ReadinessSummaryResponse {
  combined_score: number;
  trend: ReadinessTrend;
  cv_score: number | null;
  session_avg: number | null;
  gap_severity: "low" | "medium" | "high" | null;
  session_count_total: number;
  session_count_with_scores: number;
  last_n_sessions: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface ReadinessTrendItem {
  session_id: string;
  created_at: string;
  mode: PrepSessionMode | string;
  readiness_score: number | null;
  title: string | null;
}

// ---- Home summary (dashboard cards) ----

export interface HomeSummaryCardItem {
  title: string;
  description?: string;
  href?: string;
  session_id?: string;
  resume_id?: string;
  job_posting_id?: string;
}

export interface HomeSummaryCard {
  id?: string;
  title: string;
  icon: "messages" | "sparkles" | "shield";
  items: HomeSummaryCardItem[];
}

export interface HomeSummaryPayload {
  cards: HomeSummaryCard[];
}

// ---- Cover letters ----

export interface CoverLetter {
  id: string;
  resume_id: string;
  job_posting_id: string;
  session_id: string | null;
  content: string;
}

export interface GenerateCoverLetterBody {
  resume_id?: string | null;
  job_posting_id?: string | null;
  session_id?: string | null;
  tone?: string;
  length?: string;
  user_notes?: string;
}

export interface UpdateCoverLetterBody {
  content: string;
}

export interface CoverLetterDeletePayload {
  deleted: boolean;
}

