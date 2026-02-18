"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { listResumes } from "@/services/resume-uploader.service"
import { listJobPostings } from "@/services/job-postings.service"
import {
  createSession,
  deleteSession,
  listSessions,
} from "@/services/sessions.service"
import type {
  JobPosting,
  PrepSession,
  PrepSessionCreate,
  PrepSessionMode,
  Resume,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function getSessionTitle(session: PrepSession) {
  return `${session.mode} • ${session.status}`
}

export function SessionsView({ userId }: { userId?: string | null }) {
  const router = useRouter()
  const [sessionsPage, setSessionsPage] = useState(1)

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("")
  const [mode, setMode] = useState<PrepSessionMode>("TARGETED")

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PrepSession | null>(null)
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: [
      "sessions",
      "list",
      { page: sessionsPage, pageSize: 20, userId: userId ?? null },
    ],
    queryFn: () => listSessions(sessionsPage, 20, userId ?? undefined),
    placeholderData: (prev) => prev,
  })

  const optionsQuery = useQuery({
    queryKey: ["sessions", "options", { userId: userId ?? null }],
    queryFn: async (): Promise<{ resumes: Resume[]; jobPostings: JobPosting[] }> => {
      const [resumesRes, jobsRes] = await Promise.all([
        listResumes(1, 100, userId ?? undefined),
        listJobPostings(1, 100, userId ?? undefined),
      ])
      return {
        resumes: resumesRes.payload ?? [],
        jobPostings: jobsRes.payload ?? [],
      }
    },
  })

  const createSessionMutation = useMutation({
    mutationFn: async (body: PrepSessionCreate) => {
      const res = await createSession(body)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to create session.")
      }
      return res
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast.success("Session created")
      router.push(`/sessions/${res.payload!.id}`)
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create session.")
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteSession(id)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete session.")
      }
      return res
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast.success("Session deleted")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete session.")
    },
  })

  const sessions = sessionsQuery.data?.payload ?? []
  const sessionsMeta = sessionsQuery.data?.meta ?? null
  const resumes = optionsQuery.data?.resumes ?? []
  const jobPostings = optionsQuery.data?.jobPostings ?? []

  const canCreateTargeted =
    mode === "TARGETED" && selectedResumeId && selectedJobPostingId

  const canCreateQuickPractice = mode === "QUICK_PRACTICE"

  async function handleCreateSession() {
    if (createSessionMutation.isPending) return
    if (!canCreateTargeted && !canCreateQuickPractice) return

    try {
      await createSessionMutation.mutateAsync({
        user_id: userId ?? null,
        resume_id:
          mode === "TARGETED" ? selectedResumeId || null : null,
        job_posting_id:
          mode === "TARGETED" ? selectedJobPostingId || null : null,
        mode,
      })
    } catch {
      // errors shown via mutation state
    }
  }

  function openDeleteDialog(session: PrepSession) {
    deleteSessionMutation.reset()
    setDeleteTarget(session)
    setIsDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleteSessionMutation.isPending) return
    try {
      await deleteSessionMutation.mutateAsync(deleteTarget.id)
      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
    } catch {
      // errors shown via mutation state
    }
  }

  useEffect(() => {
    if (optionsQuery.isError) {
      const msg =
        optionsQuery.error instanceof Error
          ? optionsQuery.error.message
          : "Failed to load resumes and job postings"
      toast.error(msg)
    }
  }, [optionsQuery.isError, optionsQuery.error])

  useEffect(() => {
    if (sessionsQuery.isError) {
      const msg =
        sessionsQuery.error instanceof Error
          ? sessionsQuery.error.message
          : "Failed to load sessions"
      toast.error(msg)
    }
  }, [sessionsQuery.isError, sessionsQuery.error])

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Start a new prep session
            </h2>
            <p className="text-xs text-muted-foreground">
              Link a resume and job posting for targeted practice, or use quick
              practice mode without a specific role.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/cv-upload">Upload CV</Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr,1.2fr,auto]">
          <div className="space-y-2">
            <Label htmlFor="resume-select">Resume</Label>
            <Select
              value={selectedResumeId}
              onValueChange={setSelectedResumeId}
              disabled={optionsQuery.isPending || mode !== "TARGETED"}
            >
              <SelectTrigger id="resume-select">
                <SelectValue
                  placeholder={
                    optionsQuery.isPending
                      ? "Loading resumes..."
                      : resumes.length
                        ? "Select a resume"
                        : "No resumes available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.entities?.NAME?.[0] ??
                      resume.id.slice(0, 8) + "..."}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Choose the CV you want to practice with.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-select">Job posting</Label>
            <Select
              value={selectedJobPostingId}
              onValueChange={setSelectedJobPostingId}
              disabled={optionsQuery.isPending || mode !== "TARGETED"}
            >
              <SelectTrigger id="job-select">
                <SelectValue
                  placeholder={
                    optionsQuery.isPending
                      ? "Loading job postings..."
                      : jobPostings.length
                        ? "Select a job posting"
                        : "No job postings available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobPostings.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.entities?.JOB_TITLE?.[0] ?? "Job"} •{" "}
                    {job.entities?.COMPANY?.[0] ?? "Company"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Target a specific role for tailored questions.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="space-y-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="radio"
                  className="h-3.5 w-3.5 accent-primary"
                  name="session-mode"
                  value="TARGETED"
                  checked={mode === "TARGETED"}
                  onChange={() => setMode("TARGETED")}
                />
                <span>Targeted</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="radio"
                  className="h-3.5 w-3.5 accent-primary"
                  name="session-mode"
                  value="QUICK_PRACTICE"
                  checked={mode === "QUICK_PRACTICE"}
                  onChange={() => setMode("QUICK_PRACTICE")}
                />
                <span>Quick practice</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={handleCreateSession}
            disabled={
              createSessionMutation.isPending ||
              (!canCreateTargeted && !canCreateQuickPractice)
            }
          >
            {createSessionMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating session...
              </>
            ) : (
              "Start prep session"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            You can always come back to this session later from the list below.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Your prep sessions
            </h2>
            <p className="text-xs text-muted-foreground">
              Each session keeps a full chat-style history of your practice.
            </p>
          </div>
        </div>

        {sessionsQuery.isPending && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No prep sessions yet. Start one above to begin practicing.
              </div>
            ) : (
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">
                          Session
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Mode
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Readiness
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/sessions/${session.id}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {getSessionTitle(session)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {session.mode}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {session.status}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {session.readiness_score ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(session.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(session)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Delete session"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open)
            if (!open) {
              deleteSessionMutation.reset()
              setDeleteTarget(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the session and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteSessionMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void handleConfirmDelete()
                }}
                disabled={deleteSessionMutation.isPending}
              >
                {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {sessionsMeta && sessionsMeta.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={sessionsPage <= 1 || sessionsQuery.isFetching}
              onClick={() =>
                setSessionsPage((p) => Math.max(1, p - 1))
              }
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {sessionsPage} of {sessionsMeta.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={
                sessionsPage >= sessionsMeta.total_pages ||
                sessionsQuery.isFetching
              }
              onClick={() => setSessionsPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

