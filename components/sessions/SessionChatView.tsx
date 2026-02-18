"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSessionWithMessages, postChatTurn } from "@/services/sessions.service"
import type {
  Message,
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

  const canSend = input.trim().length > 0

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

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) {
        throw new Error("Session not found")
      }
      const trimmed = content.trim()
      if (!trimmed) {
        throw new Error("Please enter a message to send.")
      }

      const res = await postChatTurn(sessionId, trimmed)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to send message.")
      }
      return res.payload
    },
    onSuccess: async (payload) => {
      toast.success("Message sent")
      setInput("")
      // Optimistically append new messages if we already have a session in memory,
      // otherwise fall back to full refresh.
      if (session && payload?.new_messages?.length) {
        setSession({
          ...session,
          messages: [...session.messages, ...payload.new_messages],
        })
      } else {
        await refreshSession()
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send message.")
    },
  })

  async function handleSendMessage() {
    if (!sessionId || !canSend || chatMutation.isPending) return

    chatMutation.mutate(input)
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
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                <p className="text-base font-medium text-foreground">
                  Start your practice
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Type a message below to get your first interview question, or
                  say something like &quot;Hi&quot; to begin. Then answer each
                  question to receive feedback and improve.
                </p>
              </div>
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
          disabled={chatMutation.isPending}
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-muted-foreground">
            Messages are stored as part of this session so you can review your
            practice later.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={
                !canSend || chatMutation.isPending
              }
            >
              {chatMutation.isPending ? (
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

