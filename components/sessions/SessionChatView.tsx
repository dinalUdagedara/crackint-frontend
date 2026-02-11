"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  appendMessage,
  getSessionWithMessages,
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
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
          isUser
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
  const [sendError, setSendError] = useState<string | null>(null)

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
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error ? err.message : "Failed to load session"
        )
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

  async function handleSendMessage() {
    if (!sessionId || !canSend) return

    const body: MessageCreate = {
      sender: "USER",
      type: "QUESTION",
      content: input.trim(),
      metadata: {},
    }

    setIsSending(true)
    setSendError(null)
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
      } else {
        setSendError("Failed to send message.")
      }
    } catch (err) {
      setSendError(
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

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-1 rounded-lg border bg-muted/20 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prep session
            </p>
            <p className="text-sm font-semibold">
              {session.mode} • {session.status}
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
              ? session.readiness_score
              : "Not computed yet"}
          </span>
        </div>
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
        {sendError && (
          <div
            role="alert"
            className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {sendError}
          </div>
        )}
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
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!canSend}
          >
            {isSending ? (
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
  )
}

