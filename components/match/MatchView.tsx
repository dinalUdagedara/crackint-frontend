"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart2, FileText, Briefcase, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { useQuery } from "@tanstack/react-query"
import { listResumes } from "@/services/resume-uploader.service"
import { listJobPostings, getJobPosting } from "@/services/job-postings.service"
import {
  getStoredSkillGap,
  runSkillGapAnalysis,
  MatchError,
} from "@/services/match.service"
import type {
  JobPosting,
  Resume,
  SkillGapPayload,
} from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JobPostingSkillGapSection } from "@/components/job-postings/JobPostingSkillGapSection"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"

export function MatchView() {
  const searchParams = useSearchParams()
  const resumeIdFromUrl = searchParams.get("resume_id")
  const jobIdFromUrl = searchParams.get("job_posting_id")
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [skillGapResult, setSkillGapResult] = useState<SkillGapPayload | null>(null)
  const [skillGapError, setSkillGapError] = useState<string | null>(null)
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [candidateLocation, setCandidateLocation] = useState<string>("")
  const locationInputRef = useRef<HTMLInputElement>(null)

  const handleSetLocationRequest = () => {
    locationInputRef.current?.focus()
    locationInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }

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

  const resumes = (resumesQuery.data ?? []) as Resume[]
  const jobs = (jobsQuery.data ?? []) as JobPosting[]

  const { data: selectedJobData } = useQuery({
    queryKey: ["jobPosting", selectedJobId],
    queryFn: () => getJobPosting(axiosAuth, selectedJobId),
    enabled: !!selectedJobId && sessionStatus === "authenticated",
  })

  const selectedJob = selectedJobData?.payload ?? null

  useEffect(() => {
    if (resumeIdFromUrl && resumes.some((r) => r.id === resumeIdFromUrl)) {
      setSelectedResumeId(resumeIdFromUrl)
    }
  }, [resumeIdFromUrl, resumes])

  useEffect(() => {
    if (jobIdFromUrl && jobs.some((j) => j.id === jobIdFromUrl)) {
      setSelectedJobId(jobIdFromUrl)
    }
  }, [jobIdFromUrl, jobs])

  useEffect(() => {
    if (!selectedResumeId || !selectedJobId) {
      setSkillGapResult(null)
      setSkillGapError(null)
      setIsSkillGapLoading(false)
      return
    }

    let isMounted = true
    async function fetchStored() {
      setIsSkillGapLoading(true)
      setSkillGapError(null)
      setSkillGapResult(null)
      try {
        const res = await getStoredSkillGap(
          axiosAuth,
          selectedResumeId,
          selectedJobId
        )
        if (!isMounted) return
        if (res.success && res.payload) {
          setSkillGapResult(res.payload)
        }
        // If 404, leave result null — user must click "Analyze match" to run analysis
      } catch (err) {
        if (!isMounted) return
        if (err instanceof MatchError && err.status === 404) {
          setSkillGapError(null)
          setSkillGapResult(null)
        } else {
          setSkillGapError(
            err instanceof MatchError ? err.message : "Failed to load analysis."
          )
        }
      } finally {
        if (isMounted) setIsSkillGapLoading(false)
      }
    }

    void fetchStored()

    return () => {
      isMounted = false
    }
  }, [axiosAuth, selectedResumeId, selectedJobId])

  async function handleAnalyzeSkillGap() {
    if (!selectedResumeId || !selectedJobId || isAnalyzing) return
    setIsAnalyzing(true)
    setSkillGapError(null)
    setSkillGapResult(null)
    try {
      const res = await runSkillGapAnalysis(axiosAuth, selectedResumeId, selectedJobId, {
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

  function handleResumeChange(id: string) {
    setSelectedResumeId(id)
    setSkillGapError(null)
    setSkillGapResult(null)
  }

  function handleJobChange(id: string) {
    setSelectedJobId(id)
    setSkillGapError(null)
    setSkillGapResult(null)
  }

  const jobLabel = (job: JobPosting) =>
    job.entities?.JOB_TITLE?.[0] ?? job.id.slice(0, 8) + "..."

  return (
    <div className="space-y-8">
      <HeroGradientCard>
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart2 className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              CV vs job analysis
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare your resume with a job posting to see missing skills, fit score, and tailored suggestions.
            </p>
          </div>
        </div>
      </HeroGradientCard>

      {/* Single selection card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Choose your CV and job
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="match-resume" className="text-xs font-medium text-muted-foreground">
              Resume
            </Label>
            <Select
              value={selectedResumeId}
              onValueChange={handleResumeChange}
              disabled={resumesQuery.isPending}
            >
              <SelectTrigger id="match-resume" className="h-11 rounded-xl border-border/80 bg-muted/30">
                <span className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <SelectValue
                    placeholder={
                      resumesQuery.isPending
                        ? "Loading..."
                        : resumes.length
                          ? "Select a resume"
                          : "No resumes available"
                    }
                  />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="rounded-lg">
                    {r.entities?.NAME?.[0] ?? r.id.slice(0, 8) + "..."}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="match-location"
              className="text-xs font-medium text-muted-foreground"
            >
              Your location (optional)
            </Label>
            <input
              ref={locationInputRef}
              id="match-location"
              value={candidateLocation}
              onChange={(e) => setCandidateLocation(e.target.value)}
              placeholder="e.g. Colombo, Sri Lanka"
              className="h-11 w-full rounded-xl border border-border/80 bg-muted/30 px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-[11px] text-muted-foreground">
              Helps check if the job is practical for you and highlights remote roles.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="match-job" className="text-xs font-medium text-muted-foreground">
              Job posting
            </Label>
            <Select
              value={selectedJobId}
              onValueChange={handleJobChange}
              disabled={jobsQuery.isPending}
            >
              <SelectTrigger id="match-job" className="h-11 rounded-xl border-border/80 bg-muted/30">
                <span className="flex items-center gap-2">
                  <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                  <SelectValue
                    placeholder={
                      jobsQuery.isPending
                        ? "Loading..."
                        : jobs.length
                          ? "Select a job"
                          : "No job postings"
                    }
                  />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id} className="rounded-lg">
                    {jobLabel(j)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAnalyzeSkillGap}
            disabled={!selectedResumeId || !selectedJobId || isSkillGapLoading || isAnalyzing}
            className="h-11 rounded-xl px-6 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : skillGapResult ? (
              <>Re-analyse</>
            ) : (
              <>Analyze match</>
            )}
          </Button>
        </div>
        {selectedJob && (
          <p className="mt-3 text-xs text-muted-foreground">
            Analyzing against: <span className="font-medium text-foreground">{jobLabel(selectedJob)}</span>
          </p>
        )}
      </div>

      {/* Results (compact: no duplicate pickers) */}
      <JobPostingSkillGapSection
        resumes={resumes}
        resumesPending={resumesQuery.isPending}
        selectedResumeId={selectedResumeId}
        onResumeChange={handleResumeChange}
        onAnalyze={handleAnalyzeSkillGap}
        isSkillGapLoading={isSkillGapLoading}
        isAnalyzing={isAnalyzing}
        skillGapError={skillGapError}
        skillGapResult={skillGapResult}
        analyzeDisabled={!selectedJobId}
        compactMode
        candidateLocation={candidateLocation}
        onCandidateLocationChange={setCandidateLocation}
        onSetLocationRequest={handleSetLocationRequest}
      />
    </div>
  )
}
