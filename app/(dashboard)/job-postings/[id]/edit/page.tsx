"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { JobPostingEditForm } from "@/components/job-postings/JobPostingEditForm"

export default function JobPostingEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()
  const queryClient = useQueryClient()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") setIsLoading(false)
      return
    }
    let isMounted = true
    async function fetchJob() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getJobPosting(axiosAuth, id)
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
    void fetchJob()
    return () => {
      isMounted = false
    }
  }, [id, sessionStatus, axiosAuth])

  const handleSave = (updated: JobPosting) => {
    setJob(updated)
    void queryClient.invalidateQueries({ queryKey: ["job-postings"] })
    toast.success("Job updated")
    router.push(`/job-postings/${id}`)
  }

  const handleCancel = () => {
    router.push(`/job-postings/${id}`)
  }

  if (sessionStatus !== "authenticated") return null

  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/job-postings/${id}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to job
            </Link>
          </Button>
        </div>

        {isLoading && !job && (
          <Card className="flex items-center justify-center rounded-2xl border-border/60 py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </Card>
        )}

        {error && !job && (
          <Card className="rounded-2xl border-border/60 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/job-postings">Back to job postings</Link>
            </Button>
          </Card>
        )}

        {job && (
          <>
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-6 py-4">
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Pencil className="size-5 text-muted-foreground" />
                Edit job posting
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the details below. Changes are saved when you click Save
                changes.
              </p>
            </div>

            <Card className="rounded-2xl border-border/60 p-6 md:p-8">
              <JobPostingEditForm
                job={job}
                axiosAuth={axiosAuth}
                onSave={handleSave}
                onCancel={handleCancel}
                showCancel={true}
                idPrefix="edit-page"
              />
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
