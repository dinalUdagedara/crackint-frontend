"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getJobPosting, deleteJobPosting } from "@/services/job-postings.service"
import { EditJobPostingDialog } from "./EditJobPostingDialog"
import { listResumes } from "@/services/resume-uploader.service"
import {
  getStoredSkillGap,
  runSkillGapAnalysis,
  MatchError,
} from "@/services/match.service"
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
import { JobPostingDetailHeader } from "./JobPostingDetailHeader"
import { JobPostingMetaCard } from "./JobPostingMetaCard"
import { JobPostingEntitiesCard } from "./JobPostingEntitiesCard"
import { JobPostingSkillGapSection } from "./JobPostingSkillGapSection"
import { JobPostingReadinessSection } from "./JobPostingReadinessSection"
import { JobPostingCoverLetterSection } from "./JobPostingCoverLetterSection"
import { JobPostingRawDescription } from "./JobPostingRawDescription"

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

  useEffect(() => {
    if (!id || !job || !selectedResumeId) {
      setSkillGapResult(null)
      setSkillGapError(null)
      setIsSkillGapLoading(false)
      return
    }

    let isMounted = true
    async function fetchStoredSkillGap() {
      setIsSkillGapLoading(true)
      setSkillGapError(null)
      setSkillGapResult(null)
      try {
        const res = await getStoredSkillGap(axiosAuth, selectedResumeId, id)
        if (!isMounted) return
        if (res.success && res.payload) {
          setSkillGapResult(res.payload)
        }
      } catch (err) {
        if (!isMounted) return
        if (err instanceof MatchError && err.status === 404) {
          setSkillGapError(null)
          setSkillGapResult(null)
          try {
            const postRes = await runSkillGapAnalysis(
              axiosAuth,
              selectedResumeId,
              id,
              { use_llm: true }
            )
            if (!isMounted) return
            if (postRes.success && postRes.payload) {
              setSkillGapResult(postRes.payload)
            }
          } catch (postErr) {
            if (!isMounted) return
            setSkillGapError(
              postErr instanceof MatchError
                ? postErr.message
                : "Failed to analyze match."
            )
          }
        } else {
          setSkillGapError(
            err instanceof MatchError ? err.message : "Failed to load analysis."
          )
        }
      } finally {
        if (isMounted) setIsSkillGapLoading(false)
      }
    }

    void fetchStoredSkillGap()

    return () => {
      isMounted = false
    }
  }, [axiosAuth, id, job, selectedResumeId])

  async function handleAnalyzeSkillGap() {
    if (!id || !selectedResumeId || isAnalyzing) return
    setIsAnalyzing(true)
    setSkillGapError(null)
    setSkillGapResult(null)
    try {
      const res = await runSkillGapAnalysis(axiosAuth, selectedResumeId, id, {
        use_llm: true,
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
          <JobPostingDetailHeader
            job={job}
            onEdit={() => setShowEditDialog(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            isDeleting={isDeleting}
          />

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


          <Accordion type="single" collapsible defaultValue="meta" className="rounded-lg border bg-muted/10 text-sm">
            <AccordionItem value="meta" className="border-b px-4 last:border-b-0">
              <AccordionTrigger className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Meta
              </AccordionTrigger>
              <AccordionContent>
                <JobPostingMetaCard job={job} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="entities" className="border-b px-4 last:border-b-0">
              <AccordionTrigger className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Extracted fields
              </AccordionTrigger>
              <AccordionContent>
                <JobPostingEntitiesCard entities={job.entities} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="raw" className="border-b px-4 last:border-b-0">
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
