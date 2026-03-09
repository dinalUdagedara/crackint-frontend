"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { Loader2, Pencil } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSessionWithMessages, postChatTurn } from "@/services/sessions.service"
import { getResume } from "@/services/resume-uploader.service"
import { getJobPosting } from "@/services/job-postings.service"
import type {
  Message,
  PrepSessionWithMessages,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import ChatInputView from "@/components/home-dashboard/chat-input/ChatInputView"
import { EditSessionDialog } from "./EditSessionDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MessageSquare, Target, Bot, Sparkles } from "lucide-react"

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
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <div className="mr-4 shrink-0 mt-1">
          <div className={`flex size-8 items-center justify-center rounded-full border shadow-sm ${isFeedback
            ? "bg-amber-100/50 border-amber-200/50 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-600 dark:text-amber-500"
            : "bg-background border-border text-foreground"
            }`}>
            {isFeedback ? <Sparkles className="size-4" /> : <Bot className="size-4" />}
          </div>
        </div>
      )}
      <div
        className={`max-w-[85%] text-[15px] ${isUser
          ? "bg-[#f4f4f4] dark:bg-[#2f2f2f] text-foreground rounded-[20px] px-5 py-2.5"
          : isFeedback
            ? "bg-amber-50/50 dark:bg-amber-500/5 text-foreground rounded-2xl px-5 py-4 border border-amber-200/50 dark:border-amber-500/10 shadow-sm"
            : "bg-transparent text-foreground py-1.5"
          }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
      </div>
    </div>
  )
}

export function SessionChatView() {
  const params = useParams<{ id: string }>()
  const sessionId = params?.id
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [session, setSession] = useState<PrepSessionWithMessages | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: resumeData, isLoading: isResumeLoading } = useQuery({
    queryKey: ["resume", session?.resume_id],
    queryFn: () => getResume(axiosAuth, session!.resume_id!),
    enabled: !!session?.resume_id && sessionStatus === "authenticated",
  })

  const { data: jobData, isLoading: isJobLoading } = useQuery({
    queryKey: ["jobPosting", session?.job_posting_id],
    queryFn: () => getJobPosting(axiosAuth, session!.job_posting_id!),
    enabled: !!session?.job_posting_id && sessionStatus === "authenticated",
  })

  const resumeName = resumeData?.payload?.entities?.NAME?.[0] || (session?.resume_id ? session.resume_id.slice(0, 8) + "..." : "None")
  const jobTitle = jobData?.payload?.entities?.JOB_TITLE?.[0] || (session?.job_posting_id ? session.job_posting_id.slice(0, 8) + "..." : "None")

  const updateModeMutation = useMutation({
    mutationFn: async (newMode: "TARGETED" | "QUICK_PRACTICE" | "TUTOR_CHAT") => {
      const { updateSession } = await import("@/services/sessions.service")
      const res = await updateSession(axiosAuth, sessionId as string, {
        mode: newMode,
      })
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to update session mode.")
      }
      return res.payload
    },
    onSuccess: (updatedSession) => {
      setSession((prev) => (prev ? { ...prev, mode: updatedSession.mode } : null))
      toast.success("Session mode updated")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update session mode.")
    },
  })

  useEffect(() => {
    if (!sessionId || sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") setIsLoading(false)
      return
    }
    let isMounted = true

    async function fetchSession() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getSessionWithMessages(axiosAuth, sessionId)
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
  }, [sessionId, sessionStatus, axiosAuth])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [session?.messages?.length])

  async function refreshSession() {
    if (!sessionId) return
    try {
      const res = await getSessionWithMessages(axiosAuth, sessionId)
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

      const res = await postChatTurn(axiosAuth, sessionId, trimmed)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to send message.")
      }
      return res.payload
    },
    onSuccess: async (payload) => {
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

  async function handleSendMessage(message: string) {
    if (!sessionId || chatMutation.isPending) return
    chatMutation.mutate(message)
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
        className="mx-auto mt-4 max-w-5xl rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
    <div className="flex h-full flex-col relative overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 pb-6">
          <div className="space-y-1 rounded-lg border bg-muted/20 p-4 text-sm shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Prep session</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                        disabled={updateModeMutation.isPending}
                      >
                        {session.mode === "TUTOR_CHAT" ? (
                          <MessageSquare className="mr-1 h-3 w-3" />
                        ) : (
                          <Target className="mr-1 h-3 w-3" />
                        )}
                        {session.mode === "TUTOR_CHAT" ? "Tutor Chat" : session.mode === "QUICK_PRACTICE" ? "Quick Practice" : "Targeted"}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => updateModeMutation.mutate("TUTOR_CHAT")}
                        className={session.mode === "TUTOR_CHAT" ? "bg-muted" : ""}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Tutor Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateModeMutation.mutate(session.job_posting_id && session.resume_id ? "TARGETED" : "QUICK_PRACTICE")}
                        className={session.mode !== "TUTOR_CHAT" ? "bg-muted" : ""}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Interview Mode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {sessionTitle}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => setIsEditDialogOpen(true)}
                    aria-label="Edit session name"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Created {formatDate(session.created_at)}</div>
                <div>Updated {formatDate(session.updated_at)}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                Resume:{" "}
                {isResumeLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  resumeName
                )}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Job:{" "}
                {isJobLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  jobTitle
                )}
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

          <div className="flex flex-1 flex-col space-y-4">
            {session.messages && session.messages.length > 0 ? (
              session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="text-base font-medium text-foreground">
                  Start your practice
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {session.mode === "TUTOR_CHAT"
                    ? "Ask the coach anything about your career, resume, or interview prep."
                    : "Type a message below to get your first interview question, or say something like \"Hi\" to begin. Then answer each question to receive feedback and improve."}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <ChatInputView
        onSend={handleSendMessage}
        disabled={chatMutation.isPending}
        mode={session.mode as any}
        onModeChange={(newMode) => updateModeMutation.mutate(newMode)}
        disableTargeted={!(session.job_posting_id && session.resume_id)}
      />

      {session && (
        <EditSessionDialog
          session={session}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={(updatedSession) => {
            setSession((prev) => prev ? { ...prev, ...updatedSession } : null)
          }}
        />
      )}
    </div>
  )
}
