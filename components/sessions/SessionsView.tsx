"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { listResumes } from "@/services/resume-uploader.service"
import { listJobPostings } from "@/services/job-postings.service"
import { createSession, listSessions } from "@/services/sessions.service"
import type {
  JobPosting,
  PrepSession,
  PrepSessionMode,
  Resume,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
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

  const [sessions, setSessions] = useState<PrepSession[]>([])
  const [sessionsMeta, setSessionsMeta] = useState<{
    page: number
    page_size: number
    total_pages: number
    total_items: number
  } | null>(null)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string>("")
  const [mode, setMode] = useState<PrepSessionMode>("TARGETED")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    setSessionsError(null)
    try {
      const res = await listSessions(sessionsPage, 20, userId ?? undefined)
      if (res.success && res.payload) {
        setSessions(res.payload)
        if (res.meta) {
          setSessionsMeta(res.meta)
        }
      } else {
        setSessions([])
      }
    } catch (err) {
      setSessionsError(
        err instanceof Error ? err.message : "Failed to load sessions"
      )
      setSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }, [sessionsPage, userId])

  const fetchOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError(null)
    try {
      const [resumesRes, jobsRes] = await Promise.all([
        listResumes(1, 100, userId ?? undefined),
        listJobPostings(1, 100, userId ?? undefined),
      ])

      if (resumesRes.success && resumesRes.payload) {
        setResumes(resumesRes.payload)
      } else {
        setResumes([])
      }

      if (jobsRes.success && jobsRes.payload) {
        setJobPostings(jobsRes.payload)
      } else {
        setJobPostings([])
      }
    } catch (err) {
      setOptionsError(
        err instanceof Error
          ? err.message
          : "Failed to load resumes and job postings"
      )
      setResumes([])
      setJobPostings([])
    } finally {
      setIsLoadingOptions(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const canCreateTargeted =
    mode === "TARGETED" && selectedResumeId && selectedJobPostingId

  const canCreateQuickPractice = mode === "QUICK_PRACTICE"

  async function handleCreateSession() {
    if (isCreating) return
    if (!canCreateTargeted && !canCreateQuickPractice) return

    setIsCreating(true)
    setCreateError(null)
    try {
      const res = await createSession({
        user_id: userId ?? null,
        resume_id:
          mode === "TARGETED" ? selectedResumeId || null : null,
        job_posting_id:
          mode === "TARGETED" ? selectedJobPostingId || null : null,
        mode,
      })

      if (res.success && res.payload) {
        router.push(`/sessions/${res.payload.id}`)
      } else {
        setCreateError("Failed to create session.")
      }
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create session."
      )
    } finally {
      setIsCreating(false)
    }
  }

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

        {optionsError && (
          <div
            role="alert"
            className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {optionsError}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr,1.2fr,auto]">
          <div className="space-y-2">
            <Label htmlFor="resume-select">Resume</Label>
            <Select
              value={selectedResumeId}
              onValueChange={setSelectedResumeId}
              disabled={isLoadingOptions || mode !== "TARGETED"}
            >
              <SelectTrigger id="resume-select">
                <SelectValue
                  placeholder={
                    isLoadingOptions
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
              disabled={isLoadingOptions || mode !== "TARGETED"}
            >
              <SelectTrigger id="job-select">
                <SelectValue
                  placeholder={
                    isLoadingOptions
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
              isCreating ||
              (!canCreateTargeted && !canCreateQuickPractice)
            }
          >
            {isCreating ? (
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

        {createError && (
          <div
            role="alert"
            className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {createError}
          </div>
        )}
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

        {isLoadingSessions && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {sessionsError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {sessionsError}
              </div>
            )}

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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {sessionsMeta && sessionsMeta.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={sessionsPage <= 1 || isLoadingSessions}
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
                isLoadingSessions
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

