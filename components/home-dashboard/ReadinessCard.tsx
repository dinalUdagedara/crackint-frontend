"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getReadiness } from "@/services/readiness.service"
import { useQuery } from "@tanstack/react-query"
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { listResumes } from "@/services/resume-uploader.service"
import { listJobPostings } from "@/services/job-postings.service"
import type { Resume, JobPosting } from "@/types/api.types"

export default function ReadinessCard() {
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [resumeId, setResumeId] = useState<string>("__all__")
  const [jobPostingId, setJobPostingId] = useState<string>("__all__")

  const resumesQuery = useQuery({
    queryKey: ["resumes", "list", 1, 100],
    queryFn: async () => {
      const res = await listResumes(axiosAuth, 1, 100)
      return res.payload ?? []
    },
    enabled: sessionStatus === "authenticated",
  })

  const jobsQuery = useQuery({
    queryKey: ["job-postings", "list", 1, 100],
    queryFn: async () => {
      const res = await listJobPostings(axiosAuth, 1, 100)
      return res.payload ?? []
    },
    enabled: sessionStatus === "authenticated",
  })

  const readinessQuery = useQuery({
    queryKey: [
      "readiness",
      resumeId === "__all__" ? undefined : resumeId,
      jobPostingId === "__all__" ? undefined : jobPostingId,
    ],
    queryFn: async () => {
      const res = await getReadiness(axiosAuth, {
        resumeId: resumeId !== "__all__" ? resumeId : undefined,
        jobPostingId: jobPostingId !== "__all__" ? jobPostingId : undefined,
      })
      return res.payload
    },
    enabled: sessionStatus === "authenticated",
  })

  const resumes = (resumesQuery.data ?? []) as Resume[]
  const jobs = (jobsQuery.data ?? []) as JobPosting[]
  const payload = readinessQuery.data

  if (sessionStatus !== "authenticated") return null

  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">
        Your readiness
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Optional: select a resume and job for richer metrics.
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="readiness-resume" className="text-xs">
            Resume
          </Label>
          <Select value={resumeId} onValueChange={setResumeId}>
            <SelectTrigger id="readiness-resume">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.entities?.NAME?.[0] ?? r.id.slice(0, 8) + "..."}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="readiness-job" className="text-xs">
            Job posting
          </Label>
          <Select value={jobPostingId} onValueChange={setJobPostingId}>
            <SelectTrigger id="readiness-job">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.entities?.JOB_TITLE?.[0] ?? "Job"} • {j.entities?.COMPANY?.[0] ?? "Company"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {readinessQuery.isPending ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : readinessQuery.isError ? (
        <p className="py-4 text-sm text-muted-foreground">
          Could not load readiness.
        </p>
      ) : payload ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {payload.combined_score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {payload.trend === "improving" && (
              <TrendingUp className="size-4 text-green-600" />
            )}
            {payload.trend === "declining" && (
              <TrendingDown className="size-4 text-destructive" />
            )}
            {payload.trend === "stable" && (
              <Minus className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {payload.cv_score != null && (
              <span>CV score: {payload.cv_score}</span>
            )}
            {payload.session_avg != null && (
              <span>Session avg: {payload.session_avg}</span>
            )}
            {payload.gap_severity && (
              <span
                className={
                  payload.gap_severity === "high"
                    ? "text-destructive"
                    : payload.gap_severity === "medium"
                      ? "text-amber-600"
                      : undefined
                }
              >
                Gap: {payload.gap_severity}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="py-4 text-sm text-muted-foreground">
          No readiness data yet. Upload a CV and run prep sessions.
        </p>
      )}
    </section>
  )
}
