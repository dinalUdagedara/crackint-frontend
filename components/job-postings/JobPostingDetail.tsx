"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { getJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { Button } from "@/components/ui/button"

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function JobPostingDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let isMounted = true

    async function fetchJob() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getJobPosting(id)
        if (!isMounted) return
        if (res.success && res.payload) {
          setJob(res.payload)
        } else {
          setError("Job posting not found")
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error ? err.message : "Failed to load job posting"
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchJob()

    return () => {
      isMounted = false
    }
  }, [id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/job-postings")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to job postings
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && job && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {job.entities?.JOB_TITLE?.[0] ?? "Job posting"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {job.entities?.COMPANY?.[0] ?? "Unknown company"} •{" "}
              {job.location ?? job.entities?.LOCATION?.[0] ?? "Location unknown"}
            </p>
          </div>

          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Meta
              </h2>
              <dl className="space-y-1.5">
                <div className="flex gap-2">
                  <dt className="w-28 text-xs text-muted-foreground">
                    Job ID
                  </dt>
                  <dd className="font-mono text-xs text-foreground">
                    {job.id}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 text-xs text-muted-foreground">
                    Created
                  </dt>
                  <dd className="text-foreground">
                    {formatDate(job.created_at)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 text-xs text-muted-foreground">
                    Updated
                  </dt>
                  <dd className="text-foreground">
                    {formatDate(job.updated_at)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 text-xs text-muted-foreground">
                    Deadline
                  </dt>
                  <dd className="text-foreground">
                    {formatDate(job.deadline)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Extracted fields
              </h2>
              <div className="space-y-1.5">
                {Object.entries(job.entities ?? {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No structured entities stored for this job.
                  </p>
                ) : (
                  Object.entries(job.entities).map(([key, values]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {values.map((v) => (
                          <span
                            key={v}
                            className="inline-flex rounded-md border bg-background px-2.5 py-1 text-xs text-foreground"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Raw job description</h2>
            <div className="rounded-lg border bg-muted/10 p-4 text-sm whitespace-pre-wrap">
              {job.raw_text || (
                <span className="text-muted-foreground">
                  No raw text stored for this job posting.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

