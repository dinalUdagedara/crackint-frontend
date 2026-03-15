"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listJobPostings, deleteJobPosting } from "@/services/job-postings.service"
import { listSessions } from "@/services/sessions.service"
import type { JobPosting, PrepSession } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  BookOpen,
  Edit2,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardList,
} from "lucide-react"
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
import { EditJobPostingDialog } from "./EditJobPostingDialog"

const PREVIEW_LENGTH = 80

function getTitle(job: JobPosting): string {
  const title = job.entities?.JOB_TITLE?.[0]
  if (title) return title
  return job.raw_text
    ? job.raw_text.slice(0, PREVIEW_LENGTH) +
        (job.raw_text.length > PREVIEW_LENGTH ? "..." : "")
    : job.id.slice(0, 8) + "..."
}

function getCompany(job: JobPosting): string {
  return job.entities?.COMPANY?.[0] ?? "—"
}

function getLocation(job: JobPosting): string {
  return job.location ?? job.entities?.LOCATION?.[0] ?? "—"
}

/** Theme-aware cover gradient classes (primary/muted). */
const COVER_GRADIENTS = [
  "bg-linear-to-br from-primary/40 via-primary/20 to-muted/50",
  "bg-linear-to-br from-primary/30 to-muted/60",
  "bg-linear-to-br from-muted/50 via-primary/20 to-primary/40",
  "bg-linear-to-br from-primary/25 to-muted/40",
  "bg-linear-to-br from-muted/40 to-primary/30",
]

function getCoverGradient(jobId: string): string {
  let n = 0
  for (let i = 0; i < jobId.length; i++) n += jobId.charCodeAt(i)
  return COVER_GRADIENTS[Math.abs(n) % COVER_GRADIENTS.length] ?? COVER_GRADIENTS[0]
}

function getInitial(job: JobPosting): string {
  const company = job.entities?.COMPANY?.[0]
  if (company?.length) return company.slice(0, 1).toUpperCase()
  const title = job.entities?.JOB_TITLE?.[0]
  if (title?.length) return title.slice(0, 1).toUpperCase()
  return "J"
}

function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  try {
    const today = new Date()
    const d = new Date(deadline)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

export function JobTrackerGrid() {
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()
  const [items, setItems] = useState<JobPosting[]>([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<{
    page: number
    page_size: number
    total_pages: number
    total_items: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null)
  const [editJob, setEditJob] = useState<JobPosting | null>(null)

  const fetchPostings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await listJobPostings(axiosAuth, page, 20)
      if (res.success && res.payload) {
        setItems(res.payload)
        if (res.meta) setMeta(res.meta)
      } else {
        setItems([])
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load job postings"
      )
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [page, axiosAuth])

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchPostings()
    } else if (sessionStatus === "unauthenticated") {
      setIsLoading(false)
    }
  }, [sessionStatus, fetchPostings])

  const sessionsQuery = useQuery({
    queryKey: ["sessions", "list", 1, 100],
    queryFn: async () => {
      const res = await listSessions(axiosAuth, 1, 100)
      return res.payload ?? []
    },
    enabled: sessionStatus === "authenticated",
  })

  const sessionsByJob = useMemo(() => {
    const list = (sessionsQuery.data ?? []) as PrepSession[]
    const map: Record<string, PrepSession[]> = {}
    for (const s of list) {
      if (s.job_posting_id) {
        if (!map[s.job_posting_id]) map[s.job_posting_id] = []
        map[s.job_posting_id].push(s)
      }
    }
    return map
  }, [sessionsQuery.data])

  const handleDeleteOne = useCallback(
    async (job: JobPosting) => {
      setDeletingId(job.id)
      setError(null)
      try {
        await deleteJobPosting(axiosAuth, job.id)
        setJobToDelete(null)
        setItems((prev) => prev.filter((j) => j.id !== job.id))
        if (meta)
          setMeta({ ...meta, total_items: Math.max(0, meta.total_items - 1) })
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete job posting"
        )
      } finally {
        setDeletingId(null)
      }
    },
    [axiosAuth, meta]
  )

  const handleEditSave = useCallback(
    (updated: JobPosting) => {
      setEditJob(null)
      setItems((prev) =>
        prev.map((j) => (j.id === updated.id ? updated : j))
      )
    },
    []
  )

  if (sessionStatus !== "authenticated") return null

  if (isLoading && items.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header: title + upload */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total_items} job posting(s)` : "Your saved jobs."}
        </p>
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/job-upload">
            <ClipboardList className="size-4" />
            Upload new job poster
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No job postings yet. Upload a job poster to create one.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
              <Link href="/job-upload">
                <ClipboardList className="size-4" />
                Upload job poster
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((job) => {
              const sessions = sessionsByJob[job.id] ?? []
              const sessionCount = sessions.length
              const daysLeft = daysUntilDeadline(job.deadline)
              const isUrgent = daysLeft !== null && daysLeft <= 7

              return (
                <Card
                  key={job.id}
                  className="group overflow-hidden rounded-2xl border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Cover */}
                  <div
                    className={`relative h-28 overflow-hidden ${getCoverGradient(job.id)}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <span className="text-5xl font-bold text-primary">
                        {getInitial(job)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-1 line-clamp-2 text-lg font-semibold tracking-tight text-foreground">
                      {getTitle(job)}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {getCompany(job)}
                    </p>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 shrink-0" />
                        <span className="truncate">{getLocation(job)}</span>
                      </div>
                      {job.deadline && (
                        <div
                          className={`flex items-center gap-2 text-sm font-medium ${
                            isUrgent
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="size-4 shrink-0" />
                          {daysLeft !== null
                            ? `${daysLeft} days left`
                            : "Deadline set"}
                        </div>
                      )}
                      {sessionCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="size-4 shrink-0" />
                          {sessionCount}{" "}
                          {sessionCount === 1 ? "session" : "sessions"}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {sessionCount === 0 ? (
                      <Badge
                        variant="secondary"
                        className="mb-4 bg-muted text-muted-foreground"
                      >
                        Not started
                      </Badge>
                    ) : sessionCount >= 3 ? (
                      <Badge className="mb-4 border-0 bg-primary/15 text-primary">
                        Well prepared
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="mb-4 border-primary/30 bg-primary/10 text-primary"
                      >
                        In progress
                      </Badge>
                    )}

                    <div className="mb-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 rounded-xl"
                        asChild
                      >
                        <Link href={`/job-postings/${job.id}`}>
                          <BookOpen className="size-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setEditJob(job)}
                        aria-label="Edit job"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                    </div>

                    <Button
                      className="w-full gap-2 rounded-xl font-medium"
                      size="sm"
                      asChild
                    >
                      <Link href="/sessions">
                        {sessionCount === 0
                          ? "Start practice"
                          : "Continue practice"}
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>

                    <button
                      type="button"
                      onClick={() => setJobToDelete(job)}
                      className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {meta.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= meta.total_pages || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Footer stats */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-6 py-6">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {meta?.total_items ?? items.length}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Total jobs
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {Object.values(sessionsByJob).reduce(
                    (sum, arr) => sum + arr.length,
                    0
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Practice sessions
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">
                  {items.filter((j) => j.deadline).length}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  With deadlines
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <AlertDialog
        open={!!jobToDelete}
        onOpenChange={(open) => !open && setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job posting. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                jobToDelete && handleDeleteOne(jobToDelete)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editJob && (
        <EditJobPostingDialog
          axiosAuth={axiosAuth}
          job={editJob}
          open={!!editJob}
          onOpenChange={(open) => !open && setEditJob(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}
