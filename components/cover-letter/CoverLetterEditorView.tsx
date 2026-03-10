"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, ArrowLeft, FileText, Wand2, Sparkles, Trash2 } from "lucide-react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import {
  deleteCoverLetter,
  getCoverLetter,
  generateCoverLetter,
  updateCoverLetter,
} from "@/services/cover-letter.service"
import { getResume } from "@/services/resume-uploader.service"
import { getJobPosting } from "@/services/job-postings.service"
import type { CoverLetter, Resume, JobPosting } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export function CoverLetterEditorView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const initialResumeId = searchParams.get("resume_id")
  const initialJobPostingId = searchParams.get("job_posting_id")
  const sessionId = searchParams.get("session_id")

  const [resumeId, setResumeId] = useState<string | null>(initialResumeId)
  const [jobPostingId, setJobPostingId] = useState<string | null>(initialJobPostingId)

  const [resume, setResume] = useState<Resume | null>(null)
  const [job, setJob] = useState<JobPosting | null>(null)
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)

  const [tone, setTone] = useState<string>("formal")
  const [length, setLength] = useState<string>("medium")
  const [userNotes, setUserNotes] = useState<string>("")

  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // If we only have a session_id, try to infer resume/job IDs from the session
  useEffect(() => {
    if (!sessionId) return
    if (resumeId && jobPostingId) return
    if (sessionStatus !== "authenticated") return

    let isMounted = true

    async function resolveFromSession() {
      try {
        const { getSession } = await import("@/services/sessions.service")
        const res = await getSession(axiosAuth, sessionId as string)
        if (!isMounted) return
        if (res.success && res.payload) {
          if (res.payload.resume_id) {
            setResumeId(res.payload.resume_id)
          }
          if (res.payload.job_posting_id) {
            setJobPostingId(res.payload.job_posting_id)
          }
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error
            ? err.message
            : "Failed to resolve resume and job from session."
        )
        setIsLoading(false)
      }
    }

    void resolveFromSession()

    return () => {
      isMounted = false
    }
  }, [axiosAuth, sessionId, sessionStatus, resumeId, jobPostingId])

  useEffect(() => {
    if (!resumeId || !jobPostingId) {
      if (!sessionId) {
        setError(
          "Missing resume or job posting. Open this page from a session or job pairing view."
        )
        setIsLoading(false)
      }
      return
    }
    if (sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") {
        setIsLoading(false)
      }
      return
    }

    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [resumeRes, jobRes, letterRes] = await Promise.all([
          getResume(axiosAuth, resumeId as string),
          getJobPosting(axiosAuth, jobPostingId as string),
          getCoverLetter(axiosAuth, resumeId as string, jobPostingId as string),
        ])

        if (!isMounted) return

        if (resumeRes.success && resumeRes.payload) {
          setResume(resumeRes.payload)
        }
        if (jobRes.success && jobRes.payload) {
          setJob(jobRes.payload)
        }
        if (letterRes.success && letterRes.payload) {
          setCoverLetter(letterRes.payload)
          setContent(letterRes.payload.content)
        } else {
          setCoverLetter(null)
          setContent("")
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load cover letter. Please try again later."
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [axiosAuth, resumeId, jobPostingId, sessionStatus])

  async function handleGenerate() {
    if (!resumeId || !jobPostingId || isGenerating) return
    setIsGenerating(true)
    setError(null)
    try {
      const res = await generateCoverLetter(axiosAuth, {
        resume_id: resumeId,
        job_posting_id: jobPostingId,
        session_id: sessionId,
        tone,
        length,
        user_notes: userNotes || undefined,
      })
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Cover letter generation failed, please try again later.")
      }
      setCoverLetter(res.payload)
      setContent(res.payload.content)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cover letter generation failed, please try again later."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopy() {
    if (!content.trim()) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore copy failures
    }
  }

  async function handleSave() {
    if (!coverLetter || !content.trim() || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const res = await updateCoverLetter(axiosAuth, coverLetter.id, { content })
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to save cover letter.")
      }
      setCoverLetter(res.payload)
      setContent(res.payload.content)
      toast.success("Cover letter saved")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save cover letter."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!resumeId || !jobPostingId || isDeleting) return
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteCoverLetter(axiosAuth, resumeId, jobPostingId)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete cover letter.")
      }
      setCoverLetter(null)
      setContent("")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete cover letter."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const resumeName =
    resume?.entities?.NAME?.[0] ??
    (resumeId ? `${resumeId.slice(0, 8)}…` : "Resume not found")

  const jobTitle =
    job?.entities?.JOB_TITLE?.[0] ??
    (jobPostingId ? `${jobPostingId.slice(0, 8)}…` : "Job not found")

  const company = job?.entities?.COMPANY?.[0] ?? job?.location ?? null

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-3 py-3 sm:px-4 sm:py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                  <FileText className="h-3 w-3" />
                  <span>Cover letter editor</span>
                </span>
                {sessionId && (
                  <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px]">
                    Session linked
                  </span>
                )}
              </div>
              <h1 className="text-sm font-semibold leading-tight md:text-base">
                {jobTitle}
                {company ? <span className="text-muted-foreground"> • {company}</span> : null}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Using resume <span className="font-medium text-foreground">{resumeName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={handleCopy}
              disabled={!content.trim()}
            >
              {copied ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" />
                  Copy letter
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={handleGenerate}
              disabled={!resumeId || !jobPostingId || isGenerating || sessionStatus !== "authenticated"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  Generate
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={handleSave}
              disabled={!coverLetter || !content.trim() || isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-xs text-destructive"
              onClick={handleDelete}
              disabled={!coverLetter || isDeleting}
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 md:py-6 lg:py-8 lg:flex-row">
          <section className="w-full lg:w-[65%]">
            <div className="rounded-2xl border bg-background/80 p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Draft
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Cover letter
                    {coverLetter ? (
                      <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                        Last generated from this pairing
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
                <p>
                  This editor is for polishing your letter before you paste it into an application
                  portal. Changes are kept only in this browser tab for now.
                </p>
              </div>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="mt-4 font-normal leading-7 text-sm md:text-[15px]"
                placeholder={
                  isLoading
                    ? "Loading existing cover letter…"
                    : "Click Generate to create a tailored cover letter, then edit it here."
                }
                disabled={isLoading}
              />
            </div>
          </section>

          <aside className="w-full space-y-4 lg:w-[35%]">
            <div className="rounded-2xl border bg-muted/30 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Generation settings
              </h2>
              <div className="mt-3 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (compact)</SelectItem>
                      <SelectItem value="medium">Medium (2–3 paragraphs)</SelectItem>
                      <SelectItem value="long">Long (more detail)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-notes" className="text-[11px]">
                    Things to highlight
                  </Label>
                  <Textarea
                    id="user-notes"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={4}
                    className="text-xs"
                    placeholder="E.g. mention backend internship, FastAPI experience, or specific achievements you want emphasised."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These notes are sent to the AI as guidance when generating or regenerating your
                    letter.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                How this works
              </h2>
              <ul className="space-y-1.5">
                <li>
                  Uses your stored resume and job posting to craft a tailored cover letter.
                </li>
                <li>
                  You can regenerate with different tones or lengths — previous drafts are replaced
                  for this pairing.
                </li>
                <li>
                  Copy and paste the final version into the employer&apos;s application portal.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

