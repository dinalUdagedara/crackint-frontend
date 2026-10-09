import axios, { type AxiosInstance } from "axios"
import { API_V1, handle401 } from "@/lib/api-client"
import { readSSE } from "@/lib/sse"
import type {
  ApiResponse,
  PrepSession,
  PrepSessionCreate,
  PrepSessionUpdate,
  PrepSessionListPayload,
  PrepSessionWithMessages,
  Message,
  MessageCreate,
  MessageListPayload,
  NextQuestionPayload,
  NextQuestionRequest,
  EvaluateAnswerPayload,
  SendReplyPayload,
  ChatTurnPayload,
} from "@/types/api.types"

export class SessionsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message)
    this.name = "SessionsError"
  }
}

function throwOnAxiosError(e: unknown): never {
  if (axios.isAxiosError(e) && e.response) {
    const d = (e.response.data ?? {}) as ApiResponse<unknown>
    throw new SessionsError(
      d.message ?? `Request failed with status ${e.response.status}`,
      e.response.status,
      d.payload
    )
  }
  throw e
}

// ---- Sessions (use axiosAuth from useAxiosAuth()) ----

export async function createSession(
  axiosAuth: AxiosInstance,
  body: PrepSessionCreate
): Promise<ApiResponse<PrepSession>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<PrepSession>>(
      "/sessions",
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function listSessions(
  axiosAuth: AxiosInstance,
  page = 1,
  pageSize = 20,
  job_posting_id?: string
): Promise<ApiResponse<PrepSessionListPayload>> {
  try {
    const params: { page: number; page_size: number; job_posting_id?: string } =
      { page, page_size: pageSize }
    if (job_posting_id) params.job_posting_id = job_posting_id
    const { data } = await axiosAuth.get<ApiResponse<PrepSessionListPayload>>(
      "/sessions",
      { params }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function updateSession(
  axiosAuth: AxiosInstance,
  id: string,
  body: PrepSessionUpdate
): Promise<ApiResponse<PrepSession>> {
  try {
    const { data } = await axiosAuth.patch<ApiResponse<PrepSession>>(
      `/sessions/${id}`,
      body
    );
    return data;
  } catch (e) {
    return throwOnAxiosError(e);
  }
}

export async function getSession(
  axiosAuth: AxiosInstance,
  id: string
): Promise<ApiResponse<PrepSession>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<PrepSession>>(
      `/sessions/${id}`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function getSessionWithMessages(
  axiosAuth: AxiosInstance,
  id: string
): Promise<ApiResponse<PrepSessionWithMessages>> {
  try {
    const { data } =
      await axiosAuth.get<ApiResponse<PrepSessionWithMessages>>(
        `/sessions/${id}/with-messages`
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function postNextQuestion(
  axiosAuth: AxiosInstance,
  sessionId: string,
  body?: NextQuestionRequest
): Promise<ApiResponse<NextQuestionPayload>> {
  try {
    const { data } =
      await axiosAuth.post<ApiResponse<NextQuestionPayload>>(
        `/sessions/${sessionId}/next-question`,
        body ?? {}
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function postEvaluateAnswer(
  axiosAuth: AxiosInstance,
  sessionId: string,
  answer: string
): Promise<ApiResponse<EvaluateAnswerPayload>> {
  try {
    const { data } =
      await axiosAuth.post<ApiResponse<EvaluateAnswerPayload>>(
        `/sessions/${sessionId}/evaluate-answer`,
        { answer }
      )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function postSendReply(
  axiosAuth: AxiosInstance,
  sessionId: string,
  content: string,
  options?: { prefer_difficulty?: "easy" | "medium" | "hard" }
): Promise<ApiResponse<SendReplyPayload>> {
  try {
    const body = options?.prefer_difficulty
      ? { content, prefer_difficulty: options.prefer_difficulty }
      : { content }
    const { data } = await axiosAuth.post<ApiResponse<SendReplyPayload>>(
      `/sessions/${sessionId}/send`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function postChatTurn(
  axiosAuth: AxiosInstance,
  sessionId: string,
  content: string,
  options?: { prefer_difficulty?: "easy" | "medium" | "hard" }
): Promise<ApiResponse<ChatTurnPayload>> {
  try {
    const body = options?.prefer_difficulty
      ? { content, prefer_difficulty: options.prefer_difficulty }
      : { content }
    const { data } = await axiosAuth.post<ApiResponse<ChatTurnPayload>>(
      `/sessions/${sessionId}/chat`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export type ChatStreamEvent =
  | { event: "message"; data: { message: Message } }
  | { event: "feedback.delta"; data: { text: string } }
  | { event: "question.delta"; data: { text: string } }
  | { event: "done"; data: { status: string } }
  | { event: "error"; data: { status: number; detail: string } }

/**
 * Streaming chat turn (POST /sessions/{id}/chat/stream, Server-Sent Events).
 * Stores the same messages as postChatTurn; calls onEvent as text is generated.
 * Throws for HTTP errors before the stream starts (401, 404, 429, ...).
 */
export async function streamChatTurn(
  accessToken: string | undefined,
  sessionId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
  options?: { prefer_difficulty?: "easy" | "medium" | "hard"; signal?: AbortSignal }
): Promise<void> {
  const body = options?.prefer_difficulty
    ? { content, prefer_difficulty: options.prefer_difficulty }
    : { content }
  const res = await fetch(`${API_V1}/sessions/${sessionId}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })
  if (!res.ok || !res.body) {
    if (res.status === 401) handle401()
    let message = `Request failed with status ${res.status}`
    try {
      const data = await res.json()
      message = data?.detail ?? data?.message ?? message
    } catch {
      // non-JSON error body
    }
    throw new SessionsError(message, res.status)
  }
  await readSSE(res.body, ({ event, data }) => {
    onEvent({ event, data: JSON.parse(data) } as ChatStreamEvent)
  })
}

export async function deleteSession(
  axiosAuth: AxiosInstance,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    const { data } = await axiosAuth.delete<ApiResponse<{ id: string }>>(
      `/sessions/${id}`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

// ---- Messages ----

export async function appendMessage(
  axiosAuth: AxiosInstance,
  sessionId: string,
  body: MessageCreate
): Promise<ApiResponse<Message>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<Message>>(
      `/sessions/${sessionId}/messages`,
      body
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function listMessages(
  axiosAuth: AxiosInstance,
  sessionId: string
): Promise<ApiResponse<MessageListPayload>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<MessageListPayload>>(
      `/sessions/${sessionId}/messages`
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}
