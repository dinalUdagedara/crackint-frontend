import axios, { type AxiosInstance } from "axios"
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
  pageSize = 20
): Promise<ApiResponse<PrepSessionListPayload>> {
  try {
    const { data } = await axiosAuth.get<ApiResponse<PrepSessionListPayload>>(
      "/sessions",
      { params: { page, page_size: pageSize } }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
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
  body?: { question_type?: string; role_level?: string }
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
  content: string
): Promise<ApiResponse<SendReplyPayload>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<SendReplyPayload>>(
      `/sessions/${sessionId}/send`,
      { content }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
}

export async function postChatTurn(
  axiosAuth: AxiosInstance,
  sessionId: string,
  content: string
): Promise<ApiResponse<ChatTurnPayload>> {
  try {
    const { data } = await axiosAuth.post<ApiResponse<ChatTurnPayload>>(
      `/sessions/${sessionId}/chat`,
      { content }
    )
    return data
  } catch (e) {
    return throwOnAxiosError(e)
  }
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
