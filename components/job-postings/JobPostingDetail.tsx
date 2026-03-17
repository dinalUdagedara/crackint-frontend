"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Plus,
  FileText,
  HelpCircle,
  MessageSquare,
  User,
  Calendar,
  Link2,
  Flag,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getJobPosting, deleteJobPosting } from "@/services/job-postings.service"
import { listSessions } from "@/services/sessions.service"
import { listResumes } from "@/services/resume-uploader.service"
import { runSkillGapAnalysis, MatchError } from "@/services/match.service"
import {
  deleteCoverLetter,
  generateCoverLetter,
  getCoverLetter,
  updateCoverLetter,
} from "@/services/cover-letter.service"
import { getReadiness } from "@/services/readiness.service"
import type {
  CoverLetter,
  JobPosting,
  PrepSession,
  Resume,
  SkillGapPayload,
  ReadinessPayload,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobPostingDetailHeader } from "./JobPostingDetailHeader"
import { JobPostingMetaCard } from "./JobPostingMetaCard"
import { JobPostingEntitiesCard } from "./JobPostingEntitiesCard"
import { JobPostingSkillGapSection } from "./JobPostingSkillGapSection"
import { JobPostingReadinessSection } from "./JobPostingReadinessSection"
import { JobPostingCoverLetterSection } from "./JobPostingCoverLetterSection"
import { JobPostingRawDescription } from "./JobPostingRawDescription"

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

function formatSessionLabel(session: PrepSession): string {
  const summary = session.summary as { title?: string } | null
  const title = summary?.title && typeof summary.title === "string" ? summary.title.trim() : null
  if (title) return title
  try {
    return new Date(session.created_at).toLocaleDateString()
  } catch {
    return "Session"
  }
}

const STAGE_LABELS: Record<string, string> = {
  saved: "Saved",
  preparing: "Preparing",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
}

function getStageLabel(stage: string | null | undefined): string {
  if (!stage) return "—"
  return STAGE_LABELS[stage.toLowerCase()] ?? stage
}

export function JobPostingDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [skillGapResult, setSkillGapResult] = useState<SkillGapPayload | null>(null)
  const [skillGapError, setSkillGapError] = useState<string | null>(null)
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [candidateLocation, setCandidateLocation] = useState<string>("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null)
  const [coverLetterContent, setCoverLetterContent] = useState("")
  const [isCoverLetterLoading, setIsCoverLetterLoading] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null)
  const [isSavingCoverLetter, setIsSavingCoverLetter] = useState(false)
  const [isDeletingCoverLetter, setIsDeletingCoverLetter] = useState(false)
  const [roleReadiness, setRoleReadiness] = useState<ReadinessPayload | null>(null)
  const [roleReadinessError, setRoleReadinessError] = useState<string | null>(null)
  const [isRoleReadinessLoading, setIsRoleReadinessLoading] = useState(false)

  const resumesQuery = useQuery({
    queryKey: ["resumes", "list", 1, 100],
    queryFn: async () => {
      const res = await listResumes(axiosAuth, 1, 100)
      return res.payload ?? []
    },
    enabled: sessionStatus === "authenticated",
  })

  const sessionsForJobQuery = useQuery({
    queryKey: ["sessions", "list", "job", id],
    queryFn: async () => {
      const res = await listSessions(axiosAuth, 1, 20, id ?? undefined)
      return (res.payload ?? []) as PrepSession[]
    },
    enabled: sessionStatus === "authenticated" && !!id,
  })

  const resumes = (resumesQuery.data ?? []) as Resume[]
  const sessionsForJob = (sessionsForJobQuery.data ?? []) as PrepSession[]

  useEffect(() => {
    if (!job || !selectedResumeId) {
      setCoverLetter(null)
      setCoverLetterContent("")
      setCoverLetterError(null)
      setIsCoverLetterLoading(false)
      return
    }

    let isMounted = true
    async function fetchCoverLetter() {
      setIsCoverLetterLoading(true)
      setCoverLetterError(null)
      try {
        const res = await getCoverLetter(axiosAuth, selectedResumeId, job!.id)
        if (!isMounted) return
        if (res.success && res.payload) {
          setCoverLetter(res.payload)
          setCoverLetterContent(res.payload.content)
        } else {
          setCoverLetter(null)
          setCoverLetterContent("")
        }
      } catch (err) {
        if (!isMounted) return
        setCoverLetterError(
          err instanceof Error
            ? err.message
            : "Failed to load cover letter. Please try again."
        )
      } finally {
        if (isMounted) {
          setIsCoverLetterLoading(false)
        }
      }
    }

    void fetchCoverLetter()

    return () => {
      isMounted = false
    }
  }, [axiosAuth, job, selectedResumeId])

  // Clear result when resume or job changes so we don't show stale data
  useEffect(() => {
    if (!id || !selectedResumeId) {
      setSkillGapResult(null)
      setSkillGapError(null)
    }
  }, [id, selectedResumeId])

  // No automatic fetch when resume is selected — user must click "Analyze" or "Re-analyse"
  async function handleAnalyzeSkillGap() {
    if (!id || !selectedResumeId || isAnalyzing) return
    setIsAnalyzing(true)
    setSkillGapError(null)
    setSkillGapResult(null)
    try {
      const res = await runSkillGapAnalysis(axiosAuth, selectedResumeId, id, {
        use_llm: true,
        candidate_location: candidateLocation,
      })
      if (res.success && res.payload) {
        setSkillGapResult(res.payload)
      }
    } catch (err) {
      setSkillGapError(
        err instanceof MatchError ? err.message : "Failed to analyze match."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleFetchRoleReadiness() {
    if (!job || !selectedResumeId || isRoleReadinessLoading) return
    setIsRoleReadinessLoading(true)
    setRoleReadinessError(null)
    setRoleReadiness(null)
    try {
      const res = await getReadiness(axiosAuth, {
        resume_id: selectedResumeId,
        job_posting_id: job.id,
      })
      if (res.success && res.payload) {
        setRoleReadiness(res.payload)
      } else if (!res.success) {
        setRoleReadinessError(
          res.message || "Failed to load readiness for this role."
        )
      }
    } catch (err) {
      setRoleReadinessError(
        err instanceof Error ? err.message : "Failed to load readiness for this role."
      )
    } finally {
      setIsRoleReadinessLoading(false)
    }
  }

  async function handleGenerateCoverLetter() {
    if (!job || !selectedResumeId || isGeneratingCoverLetter) return
    setIsGeneratingCoverLetter(true)
    setCoverLetterError(null)
    try {
      const res = await generateCoverLetter(axiosAuth, {
        resume_id: selectedResumeId,
        job_posting_id: job.id,
        tone: "formal",
        length: "medium",
      })
      if (res.success && res.payload) {
        setCoverLetter(res.payload)
        setCoverLetterContent(res.payload.content)
      } else {
        setCoverLetterError(
          res.message || "Cover letter generation failed, please try again later."
        )
      }
    } catch (err) {
      setCoverLetterError(
        err instanceof Error
          ? err.message
          : "Cover letter generation failed, please try again later."
      )
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  async function handleSaveCoverLetter() {
    if (!coverLetter || !coverLetterContent.trim() || isSavingCoverLetter) return
    setIsSavingCoverLetter(true)
    setCoverLetterError(null)
    try {
      const res = await updateCoverLetter(axiosAuth, coverLetter.id, {
        content: coverLetterContent,
      })
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to save cover letter.")
      }
      setCoverLetter(res.payload)
      setCoverLetterContent(res.payload.content)
      toast.success("Cover letter saved")
    } catch (err) {
      setCoverLetterError(
        err instanceof Error ? err.message : "Failed to save cover letter."
      )
    } finally {
      setIsSavingCoverLetter(false)
    }
  }

  async function handleDeleteCoverLetter() {
    if (!job || !selectedResumeId || isDeletingCoverLetter) return
    setIsDeletingCoverLetter(true)
    setCoverLetterError(null)
    try {
      const res = await deleteCoverLetter(axiosAuth, selectedResumeId, job.id)
      if (!res.success) {
        throw new Error(res.message || "Failed to delete cover letter.")
      }
      setCoverLetter(null)
      setCoverLetterContent("")
    } catch (err) {
      setCoverLetterError(
        err instanceof Error ? err.message : "Failed to delete cover letter."
      )
    } finally {
      setIsDeletingCoverLetter(false)
    }
  }

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

    fetchJob()

    return () => {
      isMounted = false
    }
  }, [id, sessionStatus, axiosAuth])

  const handleDelete = async () => {
    if (!job) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteJobPosting(axiosAuth, job.id)
      router.push("/job-postings")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job posting")
    } finally {
      setIsDeleting(false)
    }
  }

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
          {/* Cover */}
          <div className="relative h-40 overflow-hidden rounded-xl">
            {job.cover_image_url ? (
              <img
                src={job.cover_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div
                className={`absolute inset-0 ${getCoverGradient(job.id)}`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <span className="text-6xl font-bold text-primary">
                    {getInitial(job)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <JobPostingDetailHeader
            job={job}
            editHref={`/job-postings/${job.id}/edit`}
            onDelete={() => setShowDeleteConfirm(true)}
            isDeleting={isDeleting}
          />

          {/* Practice block */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
            <h3 className="mb-3 text-sm font-medium">Practice</h3>
            {sessionsForJobQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : sessionsForJob.length === 0 ? (
              <Button asChild size="sm">
                <Link href="/sessions">Start practice</Link>
              </Button>
            ) : sessionsForJob.length === 1 ? (
              <Button asChild size="sm">
                <Link href={`/sessions/${sessionsForJob[0].id}`}>
                  Continue practice
                </Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    Continue practice
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {sessionsForJob.map((session) => (
                    <DropdownMenuItem key={session.id} asChild>
                      <Link href={`/sessions/${session.id}`}>
                        {formatSessionLabel(session)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link href="/sessions">Start new session</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <JobPostingSkillGapSection
            resumes={resumes}
            resumesPending={resumesQuery.isPending}
            selectedResumeId={selectedResumeId}
            onResumeChange={(v) => {
              setSelectedResumeId(v)
              setSkillGapError(null)
              setSkillGapResult(null)
            }}
            onAnalyze={handleAnalyzeSkillGap}
            isSkillGapLoading={isSkillGapLoading}
            isAnalyzing={isAnalyzing}
            skillGapError={skillGapError}
            skillGapResult={skillGapResult}
            candidateLocation={candidateLocation}
            onCandidateLocationChange={setCandidateLocation}
          />

          <JobPostingCoverLetterSection
            selectedResumeId={selectedResumeId}
            onGenerate={handleGenerateCoverLetter}
            isGeneratingCoverLetter={isGeneratingCoverLetter}
            coverLetterContent={coverLetterContent}
            onCoverLetterContentChange={setCoverLetterContent}
            hasCoverLetter={!!coverLetter}
            onSave={handleSaveCoverLetter}
            onDelete={handleDeleteCoverLetter}
            isSavingCoverLetter={isSavingCoverLetter}
            isDeletingCoverLetter={isDeletingCoverLetter}
            isCoverLetterLoading={isCoverLetterLoading}
            coverLetterError={coverLetterError}
          />


          {/* Prep & details: content-matched cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Prep &amp; details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Notes – notepad-style card */}
              <div className="flex flex-col rounded-xl border border-border/60 bg-muted/10 sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Notes
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" asChild aria-label="Add or edit notes">
                    <Link href={`/job-postings/${job.id}/edit`}>
                      <Plus className="size-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="min-h-16 flex-1 px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {job.notes?.trim() ?? (
                      <span className="text-muted-foreground">No notes yet. Add key requirements or follow-ups.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Questions to ask – list style */}
              <div className="flex flex-col rounded-xl border border-border/60 bg-muted/10 sm:col-span-2">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HelpCircle className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Questions to ask
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" asChild aria-label="Add or edit questions">
                    <Link href={`/job-postings/${job.id}/edit`}>
                      <Plus className="size-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="min-h-16 flex-1 px-4 py-3">
                  {job.questions_to_ask?.trim() ? (
                    <ul className="space-y-2 text-sm text-foreground">
                      {job.questions_to_ask
                        .trim()
                        .split(/\n+/)
                        .filter(Boolean)
                        .map((q, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span className="leading-relaxed">{q.trim()}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No questions added yet. Jot down what you want to ask in the interview.
                    </p>
                  )}
                </div>
              </div>

              {/* Talking points – bullet list */}
              <div className="flex flex-col rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageSquare className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Talking points
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" asChild aria-label="Add or edit talking points">
                    <Link href={`/job-postings/${job.id}/edit`}>
                      <Plus className="size-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="min-h-16 flex-1 px-4 py-3">
                  {job.talking_points?.trim() ? (
                    <ul className="space-y-2 text-sm text-foreground">
                      {job.talking_points
                        .trim()
                        .split(/\n+/)
                        .filter(Boolean)
                        .map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span className="leading-relaxed">{p.trim()}</span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add key points you want to mention.
                    </p>
                  )}
                </div>
              </div>

              {/* Contact – contact card */}
              <div className="rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Contact
                  </span>
                </div>
                <div className="px-4 py-3">
                  {job.contact_name || job.contact_email ? (
                    <div className="space-y-1.5 text-sm">
                      {job.contact_name && (
                        <p className="font-medium text-foreground">{job.contact_name}</p>
                      )}
                      {job.contact_email && (
                        <a
                          href={`mailto:${job.contact_email}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {job.contact_email}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No contact saved.
                    </p>
                  )}
                </div>
              </div>

              {/* Application URL – primary action card */}
              <div className="rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Link2 className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Job ad
                  </span>
                </div>
                <div className="px-4 py-3">
                  {job.application_url?.trim() ? (
                    <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open job ad
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No link added.
                    </p>
                  )}
                </div>
              </div>

              {/* Interview date – calendar card */}
              <div className="rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Interview
                  </span>
                </div>
                <div className="px-4 py-3">
                  {job.interview_at ? (
                    <p className="text-sm font-medium text-foreground">
                      {(() => {
                        try {
                          return new Date(job.interview_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        } catch {
                          return job.interview_at
                        }
                      })()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No date set.
                    </p>
                  )}
                </div>
              </div>

              {/* Stage – status pill card */}
              <div className="rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Flag className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Stage
                  </span>
                </div>
                <div className="px-4 py-3">
                  {job.stage?.trim() ? (
                    <Badge variant="secondary" className="font-medium">
                      {getStageLabel(job.stage)}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not set.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accordion: only Meta, Extracted fields, Raw description */}
          <Accordion type="single" collapsible defaultValue="meta" className="rounded-lg border border-border/60 bg-muted/10 text-sm">
            <AccordionItem value="meta" className="border-b border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Meta
              </AccordionTrigger>
              <AccordionContent>
                <JobPostingMetaCard job={job} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="entities" className="border-b border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Extracted fields
              </AccordionTrigger>
              <AccordionContent>
                <JobPostingEntitiesCard entities={job.entities} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="raw" className="border-b border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Raw job description
              </AccordionTrigger>
              <AccordionContent>
                <JobPostingRawDescription rawText={job.raw_text} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this job posting. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
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
      )}
    </div>
  )
}
