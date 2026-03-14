"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import Link from "next/link"
import {
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Target,
  FileText,
  BarChart2,
} from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSessionWithMessages, postChatTurn } from "@/services/sessions.service"
import { generateCoverLetter } from "@/services/cover-letter.service"
import { getResume } from "@/services/resume-uploader.service"
import { getJobPosting } from "@/services/job-postings.service"
import type { Message, PrepSessionWithMessages } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import ChatInputView from "@/components/home-dashboard/chat-input/ChatInputView"
import { EditSessionDialog } from "./EditSessionDialog"
import { SessionMessagesArea } from "./SessionMessagesArea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
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
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null)

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

  useEffect(() => {
    if (messagesEndRef.current && pendingMessage) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [pendingMessage])

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

  // Advanced mode is now a small toggle in the input; when enabled,
  // we send prefer_difficulty=\"hard\" on the next chat turn.

  async function handleGenerateCoverLetter() {
    if (!sessionId || isGeneratingCoverLetter) return
    setIsGeneratingCoverLetter(true)
    try {
      const res = await generateCoverLetter(axiosAuth, {
        session_id: sessionId,
        tone: "formal",
        length: "medium",
      })
      if (!res.success) {
        throw new Error(res.message || "Failed to generate cover letter.")
      }
      await refreshSession()
      toast.success("Cover letter generated from this session.")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Cover letter generation failed, please try again later."
      )
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  const chatMutation = useMutation({
    mutationFn: async (args: { content: string; preferDifficulty?: "easy" | "medium" | "hard" }) => {
      const { content, preferDifficulty } = args
      if (!sessionId) {
        throw new Error("Session not found")
      }
      const trimmed = content.trim()
      if (!trimmed) {
        throw new Error("Please enter a message to send.")
      }

      const res = await postChatTurn(
        axiosAuth,
        sessionId,
        trimmed,
        preferDifficulty ? { prefer_difficulty: preferDifficulty } : undefined,
      )
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to send message.")
      }
      return res.payload
    },
    onSuccess: async (payload) => {
      // Optimistically append new messages if we already have a session in memory,
      // otherwise fall back to full refresh.
      if (session && payload?.new_messages?.length) {
        // Backend v2 returns message meta as "meta"; normalize to "metadata" for UI.
        const normalized = payload.new_messages.map((msg) => ({
          ...msg,
          metadata: msg.metadata ?? msg.meta ?? {},
        }))
        setSession({
          ...session,
          messages: [...session.messages, ...normalized],
        })
      } else {
        await refreshSession()
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send message.")
    },
    onSettled: () => {
      setPendingMessage(null)
    },
  })

  async function handleSendMessage(message: string) {
    if (!sessionId || chatMutation.isPending) return

    const trimmed = message.trim()
    if (!trimmed) {
      toast.error("Please enter a message to send.")
      return
    }

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender: "USER",
      type: "ANSWER",
      content: trimmed,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setPendingMessage(tempMessage)
    chatMutation.mutate({
      content: trimmed,
      preferDifficulty:
        session && session.mode === "TUTOR_CHAT" ? undefined : difficulty ?? undefined,
    })
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
      {/* Full-width header bar across the session view */}
      <div className="sticky top-0 z-20 w-full border border-border/70 bg-linear-to-br from-muted/40 via-background to-background backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl px-4 py-4">
          <div className="w-full rounded-xl  p-4 md:p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
                    Prep session
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1 rounded-full border-border/70 bg-background/60 px-2 text-[11px] font-medium text-muted-foreground hover:text-primary"
                        disabled={updateModeMutation.isPending}
                      >
                        {session.mode === "TUTOR_CHAT" ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : (
                          <Target className="h-3 w-3" />
                        )}
                        <span>
                          {session.mode === "TUTOR_CHAT"
                            ? "Tutor Chat"
                            : session.mode === "QUICK_PRACTICE"
                              ? "Quick Practice"
                              : "Targeted"}
                        </span>
                        <ChevronDown className="h-3 w-3" />
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
                        onClick={() =>
                          updateModeMutation.mutate(
                            session.job_posting_id && session.resume_id
                              ? "TARGETED"
                              : "QUICK_PRACTICE",
                          )
                        }
                        className={session.mode !== "TUTOR_CHAT" ? "bg-muted" : ""}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Interview Mode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold leading-snug md:text-lg">
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
              <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          session.status === "ACTIVE"
                            ? "#22c55e"
                            : session.status === "COMPLETED"
                              ? "#60a5fa"
                              : "#a1a1aa",
                      }}
                    />
                    <span className="uppercase tracking-wide">
                      {session.status ?? "Unknown status"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-6 w-6 text-muted-foreground hover:text-primary md:hidden"
                    onClick={() => setIsHeaderCollapsed((prev) => !prev)}
                    aria-label={isHeaderCollapsed ? "Expand session header" : "Collapse session header"}
                  >
                    {isHeaderCollapsed ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                {!isHeaderCollapsed && (
                  <>
                    <div>Created {formatDate(session.created_at)}</div>
                    <div>Updated {formatDate(session.updated_at)}</div>
                  </>
                )}
              </div>
            </div>
            {!isHeaderCollapsed && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1">
                    <span className="font-medium text-foreground/80">Resume</span>
                    <span className="text-muted-foreground/70">·</span>
                    {isResumeLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span>{resumeName}</span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1">
                    <span className="font-medium text-foreground/80">Job</span>
                    <span className="text-muted-foreground/70">·</span>
                    {isJobLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span>{jobTitle}</span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1">
                    <span className="font-medium text-foreground/80">Readiness</span>
                    <span className="text-muted-foreground/70">·</span>
                    <span>
                      {session.readiness_score != null
                        ? `${Math.round(session.readiness_score)} / 100`
                        : "Not computed yet"}
                    </span>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {session.resume_id && session.job_posting_id && (
                      <Button variant="outline" size="xs" className="h-7 gap-1 rounded-full border-border/70 bg-background/60 px-2 text-[11px]" asChild>
                        <Link
                          href={`/match?resume_id=${encodeURIComponent(session.resume_id)}&job_posting_id=${encodeURIComponent(session.job_posting_id)}`}
                        >
                          <BarChart2 className="h-3 w-3" />
                          <span>Analyze CV vs job</span>
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 gap-1 rounded-full border-border/70 bg-background/60 px-2 text-[11px]"
                      onClick={handleGenerateCoverLetter}
                      disabled={
                        isGeneratingCoverLetter || !(session.resume_id && session.job_posting_id)
                      }
                    >
                      {isGeneratingCoverLetter ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3" />
                          <span>Generate cover letter</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {session.summary && (
                  <div className="mt-4 grid gap-4 text-xs text-muted-foreground md:grid-cols-2">
                    {typeof (session.summary as any).strengths === "string" && (
                      <div className="rounded-lg bg-background/60 p-3">
                        <p className="text-[11px] font-semibold text-foreground">
                          Strengths
                        </p>
                        <p className="mt-1 leading-relaxed">
                          {(session.summary as any).strengths as string}
                        </p>
                      </div>
                    )}
                    {typeof (session.summary as any).areas_for_improvement ===
                      "string" && (
                        <div className="rounded-lg bg-background/60 p-3">
                          <p className="text-[11px] font-semibold text-foreground">
                            Areas for improvement
                          </p>
                          <p className="mt-1 leading-relaxed">
                            {(session.summary as any).areas_for_improvement as string}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SessionMessagesArea
        session={session}
        messagesEndRef={messagesEndRef}
        pendingMessage={pendingMessage}
      />

      <ChatInputView
        onSend={handleSendMessage}
        disabled={chatMutation.isPending}
        mode={session.mode as any}
        onModeChange={(newMode) => updateModeMutation.mutate(newMode)}
        disableTargeted={!(session.job_posting_id && session.resume_id)}
        difficulty={session.mode !== "TUTOR_CHAT" ? difficulty : null}
        onDifficultyChange={
          session.mode !== "TUTOR_CHAT" ? setDifficulty : undefined
        }
      />

      {session && (
        <EditSessionDialog
          session={session as any}
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
