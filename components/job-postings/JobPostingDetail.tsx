"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, AlertTriangle, Pencil, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getJobPosting, deleteJobPosting } from "@/services/job-postings.service"
import { EditJobPostingDialog } from "./EditJobPostingDialog"
import { listResumes } from "@/services/resume-uploader.service"
import { getSkillGap, MatchError } from "@/services/match.service"
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
  Resume,
  SkillGapPayload,
  ReadinessPayload,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [job, setJob] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [skillGapResult, setSkillGapResult] = useState<SkillGapPayload | null>(null)
  const [skillGapError, setSkillGapError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [useLlm, setUseLlm] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
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

  const resumes = (resumesQuery.data ?? []) as Resume[]

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedResumeId) ?? null,
    [resumes, selectedResumeId]
  )

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

  async function handleAnalyzeSkillGap() {
    if (!id || !selectedResumeId || isAnalyzing) return
    setIsAnalyzing(true)
    setSkillGapError(null)
    setSkillGapResult(null)
    try {
      const res = await getSkillGap(axiosAuth, selectedResumeId, id, {
        use_llm: useLlm,
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {job.entities?.JOB_TITLE?.[0] ?? "Job posting"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {job.entities?.COMPANY?.[0] ?? "Unknown company"} •{" "}
                {job.location ?? job.entities?.LOCATION?.[0] ?? "Location unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </div>
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

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <h2 className="text-sm font-medium">Check match with my CV</h2>
            <p className="text-xs text-muted-foreground">
              Compare your resume with this job posting to see missing skills and
              suggestions.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] space-y-1.5">
                <Label htmlFor="skill-gap-resume">Resume</Label>
                <Select
                  value={selectedResumeId}
                  onValueChange={(v) => {
                    setSelectedResumeId(v)
                    setSkillGapError(null)
                    setSkillGapResult(null)
                  }}
                  disabled={resumesQuery.isPending}
                >
                  <SelectTrigger id="skill-gap-resume">
                    <SelectValue
                      placeholder={
                        resumesQuery.isPending
                          ? "Loading..."
                          : resumes.length
                            ? "Select a resume"
                            : "No resumes available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.entities?.NAME?.[0] ?? r.id.slice(0, 8) + "..."}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useLlm}
                  onChange={(e) => setUseLlm(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                Include AI fit analysis
              </label>
              <Button
                onClick={handleAnalyzeSkillGap}
                disabled={!selectedResumeId || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
            {skillGapError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {skillGapError}
              </div>
            )}
            {skillGapResult && (
              <div className="space-y-3 pt-2">
                {skillGapResult.llm_fit_analysis && (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <h3 className="text-xs font-medium text-muted-foreground">
                      AI fit analysis
                    </h3>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-semibold tabular-nums">
                        {skillGapResult.llm_fit_analysis.fit_score}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100 fit</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {skillGapResult.llm_fit_analysis.summary}
                    </p>
                    {skillGapResult.llm_fit_analysis.tailored_suggestions.length >
                      0 && (
                        <div>
                          <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                            Tailored suggestions
                          </h4>
                          <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                            {skillGapResult.llm_fit_analysis.tailored_suggestions.map(
                              (s, i) => (
                                <li key={i}>{s}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
                {skillGapResult.alerts.length > 0 && (
                  <div className="space-y-2">
                    {skillGapResult.alerts.map((a, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${a.severity === "high"
                          ? "border border-destructive/50 bg-destructive/10 text-destructive"
                          : a.severity === "medium"
                            ? "border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "border border-muted bg-muted/30 text-muted-foreground"
                          }`}
                      >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {a.message}
                      </div>
                    ))}
                  </div>
                )}
                {skillGapResult.missing_skills.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Missing skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGapResult.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {skillGapResult.suggestions.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Suggestions
                    </h3>
                    <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                      {skillGapResult.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Role-specific readiness</h2>
                <p className="text-xs text-muted-foreground">
                  Combined readiness score for this job and selected CV (CV match, past
                  sessions, and gaps).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchRoleReadiness}
                disabled={!selectedResumeId || isRoleReadinessLoading}
              >
                {isRoleReadinessLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check readiness"
                )}
              </Button>
            </div>
            {roleReadinessError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {roleReadinessError}
              </div>
            )}
            {roleReadiness && (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Readiness
                  </span>
                  <span className="text-sm font-semibold">
                    {Math.round(roleReadiness.combined_score)} / 100
                  </span>
                </div>
                {roleReadiness.cv_score !== null && (
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    CV {Math.round(roleReadiness.cv_score)} / 100
                  </span>
                )}
                {roleReadiness.session_avg !== null && (
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    Sessions avg {Math.round(roleReadiness.session_avg)} / 100
                  </span>
                )}
                {roleReadiness.gap_severity && (
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    Gap: {roleReadiness.gap_severity}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <h2 className="text-sm font-medium">Generate cover letter</h2>
            <p className="text-xs text-muted-foreground">
              Use your selected resume and this job posting to generate a tailored cover letter.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGenerateCoverLetter}
                disabled={!selectedResumeId || isGeneratingCoverLetter}
              >
                {isGeneratingCoverLetter ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate cover letter"
                )}
              </Button>
              {!selectedResumeId && (
                <p className="text-xs text-muted-foreground">
                  Select a resume above to enable cover letter generation.
                </p>
              )}
            </div>
            {coverLetter && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveCoverLetter}
                  disabled={isSavingCoverLetter || !coverLetterContent.trim()}
                >
                  {isSavingCoverLetter ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCoverLetter}
                  disabled={isDeletingCoverLetter}
                >
                  {isDeletingCoverLetter ? "Deleting..." : "Delete cover letter"}
                </Button>
              </div>
            )}
            {coverLetterError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {coverLetterError}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="cover-letter-editor">Cover letter</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-6 gap-1 px-2 text-[11px]"
                  onClick={async () => {
                    if (!coverLetterContent.trim()) return
                    try {
                      await navigator.clipboard.writeText(coverLetterContent)
                    } catch {
                      // ignore copy failure
                    }
                  }}
                  disabled={!coverLetterContent.trim()}
                >
                  Copy
                </Button>
              </div>
              <Textarea
                id="cover-letter-editor"
                value={coverLetterContent}
                onChange={(e) => setCoverLetterContent(e.target.value)}
                placeholder={
                  isCoverLetterLoading
                    ? "Loading existing cover letter..."
                    : "Generated cover letter will appear here. You can edit it before copying."
                }
                rows={12}
                disabled={isCoverLetterLoading}
                className="font-normal leading-7 text-sm md:text-[15px]"
              />
              <p className="text-[11px] text-muted-foreground">
                Edits are not saved back to the backend yet. Copy this text to use it in your application.
              </p>
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
          <EditJobPostingDialog
            key={job.updated_at ?? job.id}
            axiosAuth={axiosAuth}
            job={job}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSave={(updated) => {
              setJob(updated)
              setShowEditDialog(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

