import type {
  ApiResponse,
  PrepSession,
  PrepSessionCreate,
  PrepSessionListPayload,
  PrepSessionWithMessages,
  Message,
  MessageCreate,
  MessageListPayload,
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

// ---- Sessions ----

export async function createSession(
  body: PrepSessionCreate
): Promise<ApiResponse<PrepSession>> {
  const res = await fetch(SESSIONS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<PrepSession>(res)
}

export async function listSessions(
  page = 1,
  pageSize = 20,
  userId?: string
): Promise<ApiResponse<PrepSessionListPayload>> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("page_size", String(pageSize))
  if (userId) params.set("user_id", userId)

  const res = await fetch(`${SESSIONS_BASE}?${params.toString()}`)
  return parseResponse<PrepSessionListPayload>(res)
}

export async function getSession(
  id: string
): Promise<ApiResponse<PrepSession>> {
  const res = await fetch(`${SESSIONS_BASE}/${id}`)
  return parseResponse<PrepSession>(res)
}

export async function getSessionWithMessages(
  id: string
): Promise<ApiResponse<PrepSessionWithMessages>> {
  const res = await fetch(`${SESSIONS_BASE}/${id}/with-messages`)
  return parseResponse<PrepSessionWithMessages>(res)
}

// ---- Messages ----

export async function appendMessage(
  sessionId: string,
  body: MessageCreate
): Promise<ApiResponse<Message>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<Message>(res)
}

export async function listMessages(
  sessionId: string
): Promise<ApiResponse<MessageListPayload>> {
  const res = await fetch(`${SESSIONS_BASE}/${sessionId}/messages`)
  return parseResponse<MessageListPayload>(res)
}

