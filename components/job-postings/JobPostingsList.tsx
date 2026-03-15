"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Trash2, AlertCircle, ClipboardList } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listJobPostings, deleteJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

const PREVIEW_LENGTH = 120

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function getTitle(job: JobPosting): string {
  const title = job.entities?.JOB_TITLE?.[0]
  if (title) return title
  return job.raw_text
    ? job.raw_text.slice(0, PREVIEW_LENGTH) +
        (job.raw_text.length > PREVIEW_LENGTH ? "..." : "")
    : job.id.slice(0, 8) + "..."
}

function getCompany(job: JobPosting): string {
  return job.entities?.COMPANY?.[0] ?? "-"
}

function getLocation(job: JobPosting): string {
  return job.location ?? job.entities?.LOCATION?.[0] ?? "-"
}

export function JobPostingsList() {
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

  const fetchPostings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await listJobPostings(axiosAuth, page, 20)
      if (res.success && res.payload) {
        setItems(res.payload)
        if (res.meta) {
          setMeta(res.meta)
        }
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

  const handleDeleteOne = useCallback(
    async (job: JobPosting) => {
      setDeletingId(job.id)
      setError(null)
      try {
        await deleteJobPosting(axiosAuth, job.id)
        setJobToDelete(null)
        setItems((prev) => prev.filter((j) => j.id !== job.id))
        if (meta) setMeta({ ...meta, total_items: Math.max(0, meta.total_items - 1) })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete job posting")
      } finally {
        setDeletingId(null)
      }
    },
    [axiosAuth, meta]
  )

  if (isLoading && items.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
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
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Your job postings</CardTitle>
              <CardDescription>
                {meta ? `${meta.total_items} job posting(s)` : "View and manage your saved jobs."}
              </CardDescription>
            </div>
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/job-upload">
                <ClipboardList className="size-4" />
                Upload new job poster
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center">
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
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((job) => (
                      <tr key={job.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <Link
                            href={`/job-postings/${job.id}`}
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {getTitle(job)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {getCompany(job)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {getLocation(job)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(job.deadline)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setJobToDelete(job)}
                            disabled={!!deletingId}
                            aria-label="Delete job posting"
                          >
                            {deletingId === job.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-border/60 px-4 py-3">
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
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!jobToDelete}
        onOpenChange={(open) => !open && setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job posting. This action cannot be undone.
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
    </div>
  )
}

