import type {
  ApiResponse,
  PrepSession,
  PrepSessionCreate,
  PrepSessionListPayload,
  PrepSessionWithMessages,
  Message,
  MessageCreate,
  MessageListPayload,
  NextQuestionPayload,
  EvaluateAnswerPayload,
  SendReplyPayload,
  ChatTurnPayload,
} from "@/types/api.types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const SESSIONS_BASE = `${API_BASE}/api/v1/sessions`

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

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T>
  if (!res.ok) {
    throw new SessionsError(
      data.message ?? `Request failed with status ${res.status}`,
      res.status,
      data.payload
    )
  }
  return data
}

function headers(accessToken?: string, json = true): Record<string, string> {
  const h: Record<string, string> = {}
  if (json) h["Content-Type"] = "application/json"
  if (accessToken) h["Authorization"] = `Bearer ${accessToken}`
  return h
}

// ---- Sessions ----

export async function createSession(
  body: PrepSessionCreate,
  accessToken?: string
): Promise<ApiResponse<PrepSession>> {
  const res = await fetch(SESSIONS_BASE, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify(body),
  })
  return parseResponse<PrepSession>(res)
}

export async function listSessions(
  page = 1,
  pageSize = 20,
  userId?: string,
  accessToken?: string
): Promise<ApiResponse<PrepSessionListPayload>> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("page_size", String(pageSize))
  if (userId) params.set("user_id", userId)

  const res = await fetch(`${SESSIONS_BASE}?${params.toString()}`, {
    headers: headers(accessToken, false),
  })
  return parseResponse<PrepSessionListPayload>(res)
}

export async function getSession(
  id: string,
  accessToken?: string
): Promise<ApiResponse<PrepSession>> {
  const res = await fetch(`${SESSIONS_BASE}/${id}`, {
    headers: headers(accessToken, false),
  })
  return parseResponse<PrepSession>(res)
}

export async function getSessionWithMessages(
  id: string,
  accessToken?: string
): Promise<ApiResponse<PrepSessionWithMessages>> {
  const res = await fetch(`${SESSIONS_BASE}/${id}/with-messages`, {
    headers: headers(accessToken, false),
  })
  return parseResponse<PrepSessionWithMessages>(res)
}

export async function postNextQuestion(
  sessionId: string,
  body?: { question_type?: string; role_level?: string },
  accessToken?: string
): Promise<ApiResponse<NextQuestionPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/next-question`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify(body ?? {}),
  })
  return parseResponse<NextQuestionPayload>(res)
}

export async function postEvaluateAnswer(
  sessionId: string,
  answer: string,
  accessToken?: string
): Promise<ApiResponse<EvaluateAnswerPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/evaluate-answer`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({ answer }),
  })
  return parseResponse<EvaluateAnswerPayload>(res)
}

export async function postSendReply(
  sessionId: string,
  content: string,
  accessToken?: string
): Promise<ApiResponse<SendReplyPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/send`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({ content }),
  })
  return parseResponse<SendReplyPayload>(res)
}

export async function postChatTurn(
  sessionId: string,
  content: string,
  accessToken?: string
): Promise<ApiResponse<ChatTurnPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/chat`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({ content }),
  })
  return parseResponse<ChatTurnPayload>(res)
}

export async function deleteSession(
  id: string,
  accessToken?: string
): Promise<ApiResponse<{ id: string }>> {
  const res = await fetch(`${SESSIONS_BASE}/${id}`, {
    method: "DELETE",
    headers: headers(accessToken, false),
  })
  return parseResponse<{ id: string }>(res)
}

// ---- Messages ----

export async function appendMessage(
  sessionId: string,
  body: MessageCreate,
  accessToken?: string
): Promise<ApiResponse<Message>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/messages`, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify(body),
  })
  return parseResponse<Message>(res)
}

export async function listMessages(
  sessionId: string,
  accessToken?: string
): Promise<ApiResponse<MessageListPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/messages`, {
    headers: headers(accessToken, false),
  })
  return parseResponse<MessageListPayload>(res)
}

