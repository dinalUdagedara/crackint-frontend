"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { listJobPostings } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { Button } from "@/components/ui/button"

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

  const fetchPostings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await listJobPostings(page, 20)
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
  }, [page])

  useEffect(() => {
    fetchPostings()
  }, [fetchPostings])

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total_items} job posting(s)` : "Job postings"}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/job-upload">Upload new job poster</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No job postings yet. Upload a job poster to create one.
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Deadline</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((job) => (
                  <tr key={job.id} className="border-b last:border-0">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
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
            disabled={page >= meta.total_pages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

