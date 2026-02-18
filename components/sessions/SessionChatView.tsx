"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  appendMessage,
  getSession,
  getSessionWithMessages,
  postEvaluateAnswer,
  postNextQuestion,
} from "@/services/sessions.service"
import type {
  Message,
  MessageCreate,
  PrepSessionWithMessages,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "USER"
  const isFeedback = message.type === "FEEDBACK"

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"
        }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${isUser
            ? "bg-primary text-primary-foreground"
            : isFeedback
              ? "bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
              : "bg-muted text-foreground"
          }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}

export function SessionChatView() {
  const params = useParams<{ id: string }>()
  const sessionId = params?.id

  const [session, setSession] = useState<PrepSessionWithMessages | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let isMounted = true

    async function fetchSession() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getSessionWithMessages(sessionId)
        if (!isMounted) return
        if (res.success && res.payload) {
          setSession(res.payload)
        } else {
          setError("Session not found")
          toast.error("Session not found")
        }
      } catch (err) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Failed to load session"
        setError(msg)
        toast.error(msg)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSession()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [session?.messages?.length])

  const canSend = input.trim().length > 0 && !isSending

  async function refreshSession() {
    if (!sessionId) return
    try {
      const res = await getSessionWithMessages(sessionId)
      if (res.success && res.payload) {
        setSession(res.payload)
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh session"
      )
    }
  }

  const nextQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error("Session not found")
      }
      const res = await postNextQuestion(sessionId)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to get next question.")
      }
      return res.payload
    },
    onSuccess: async () => {
      toast.success("Next question generated")
      await refreshSession()
    },
    onError: (err) => {
      toast.error(err.message || "Failed to get next question.")
    },
  })

  const evaluateAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      if (!sessionId) {
        throw new Error("Session not found")
      }
      const trimmed = answer.trim()
      if (!trimmed) {
        throw new Error("Please enter an answer to evaluate.")
      }

      // Store the user's answer message first
      await appendMessage(sessionId, {
        sender: "USER",
        type: "ANSWER",
        content: trimmed,
        metadata: {},
      })

      const res = await postEvaluateAnswer(sessionId, trimmed)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to evaluate answer.")
      }
      return res.payload
    },
    onSuccess: async () => {
      toast.success("Answer evaluated")
      await refreshSession()
    },
    onError: (err) => {
      toast.error(err.message || "Failed to evaluate answer.")
    },
  })

  async function handleSendMessage() {
    if (!sessionId || !canSend) return

    const trimmed = input.trim()
    const lastMessage =
      session && session.messages && session.messages.length > 0
        ? session.messages[session.messages.length - 1]
        : null

    // If the last message was an ASSISTANT QUESTION, treat this as an answer
    if (
      lastMessage &&
      lastMessage.sender === "ASSISTANT" &&
      lastMessage.type === "QUESTION"
    ) {
      if (evaluateAnswerMutation.isPending) return
      evaluateAnswerMutation.mutate(trimmed)
      return
    }

    // Otherwise, treat as a user question / prompt and store it,
    // then optionally ask the next question from the agent.
    const body: MessageCreate = {
      sender: "USER",
      type: "QUESTION",
      content: trimmed,
      metadata: {},
    }

    setIsSending(true)
    try {
      const res = await appendMessage(sessionId, body)
      if (res.success && res.payload) {
        const newMessage = res.payload
        setSession((prev) =>
          prev
            ? {
              ...prev,
              messages: [...(prev.messages ?? []), newMessage],
            }
            : prev
        )
        setInput("")
        // After a user prompt, we can ask the agent for the next question
        if (!nextQuestionMutation.isPending) {
          nextQuestionMutation.mutate()
        }
      } else {
        toast.error("Failed to send message.")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message."
      )
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading && !session) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLoading && error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    )
  }

  if (!session) return null

  const summary = session.summary as { [key: string]: unknown } | null
  const sessionTitle =
    (summary && typeof summary.title === "string" && summary.title.trim()) ||
    `${session.mode} • ${session.status}`

  const lastMessage =
    session.messages && session.messages.length > 0
      ? session.messages[session.messages.length - 1]
      : null
  const canShowNextQuestionButton =
    lastMessage &&
    lastMessage.sender === "ASSISTANT" &&
    lastMessage.type === "FEEDBACK"

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-1 rounded-lg border bg-muted/20 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prep session
            </p>
            <p className="text-sm font-semibold">
              {sessionTitle}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Created {formatDate(session.created_at)}</div>
            <div>Updated {formatDate(session.updated_at)}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Resume:{" "}
            {session.resume_id ? session.resume_id.slice(0, 8) + "..." : "None"}
          </span>
          <span>•</span>
          <span>
            Job:{" "}
            {session.job_posting_id
              ? session.job_posting_id.slice(0, 8) + "..."
              : "None"}
          </span>
          <span>•</span>
          <span>
            Readiness score:{" "}
            {session.readiness_score != null
              ? Math.round(session.readiness_score)
              : "Not computed yet"}
          </span>
        </div>
        {session.summary && (
          <div className="mt-3 grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
            {typeof (session.summary as any).strengths === "string" && (
              <div>
                <p className="font-medium text-foreground text-xs">
                  Strengths
                </p>
                <p className="mt-1">
                  {(session.summary as any).strengths as string}
                </p>
              </div>
            )}
            {typeof (session.summary as any).areas_for_improvement ===
              "string" && (
                <div>
                  <p className="font-medium text-foreground text-xs">
                    Areas for improvement
                  </p>
                  <p className="mt-1">
                    {(session.summary as any).areas_for_improvement as string}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border bg-background">
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {session.messages && session.messages.length > 0 ? (
              session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                No messages yet. Start by asking a question or answering a
                prompt.
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question or answer here..."
          rows={3}
          className="text-sm"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-muted-foreground">
            Messages are stored as part of this session so you can review your
            practice later.
          </p>
          <div className="flex items-center gap-2">
            {canShowNextQuestionButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!nextQuestionMutation.isPending && sessionId) {
                    nextQuestionMutation.mutate()
                  }
                }}
                disabled={
                  nextQuestionMutation.isPending || evaluateAnswerMutation.isPending
                }
              >
                {nextQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Next question"
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={
                !canSend ||
                nextQuestionMutation.isPending ||
                evaluateAnswerMutation.isPending
              }
            >
              {isSending ||
              nextQuestionMutation.isPending ||
              evaluateAnswerMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

