"use client"

import { useCallback, useEffect, useState } from "react"
import { FileUp, FileCheck, Loader2 } from "lucide-react"
import { AIExtractionLoader } from "@/components/cv-upload/AIExtractionLoader"
import CVFileDropZone from "@/components/cv-upload/CVFileDropZone"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listResumes } from "@/services/resume-uploader.service"
import {
  scoreResumeFromFile,
  getResumeScore,
  CVScoringError,
} from "@/services/cv-scoring.service"
import type { CVScorePayload, Resume } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScoreResultCard } from "./ScoreResultCard"

export default function CVScoreView() {
  const axiosAuth = useAxiosAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<"file" | "existing">("file")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  /** When scoring from file, optionally save score to this resume. Use sentinel since Select.Item cannot have value "". */
  const SAVE_SCORE_NONE = "__none__"
  const [saveScoreToResumeId, setSaveScoreToResumeId] = useState<string>(SAVE_SCORE_NONE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CVScorePayload | null>(null)
  const [scoreSavedToResume, setScoreSavedToResume] = useState(false)

  const resumesQuery = useQuery({
    queryKey: ["resumes", "list", 1, 100],
    queryFn: async () => {
      const res = await listResumes(axiosAuth, 1, 100)
      return res.payload ?? []
    },
  })

  const resumes = (resumesQuery.data ?? []) as Resume[]

  const scoreFromFile = useCallback(async () => {
    if (!selectedFile) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    setScoreSavedToResume(false)
    try {
      const resumeIdToSave =
        saveScoreToResumeId && saveScoreToResumeId !== SAVE_SCORE_NONE
          ? saveScoreToResumeId
          : undefined
      const res = await scoreResumeFromFile(
        axiosAuth,
        selectedFile,
        resumeIdToSave
      )
      if (res.success && res.payload) {
        setResult(res.payload)
        if (resumeIdToSave) {
          setScoreSavedToResume(true)
          void queryClient.invalidateQueries({ queryKey: ["resumes"] })
        }
      }
    } catch (err) {
      setError(
        err instanceof CVScoringError
          ? err.message
          : "Failed to score CV. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [axiosAuth, selectedFile, saveScoreToResumeId, queryClient])

  const selectedResume = selectedResumeId
    ? resumes.find((r) => r.id === selectedResumeId)
    : null
  const hasStoredScore =
    selectedResume?.cv_score != null || selectedResume?.cv_scored_at != null

  const scoreExistingResume = useCallback(
    async (forceReScore = false) => {
      if (!selectedResumeId) return
      setIsLoading(true)
      setError(null)
      setResult(null)
      try {
        const res = await getResumeScore(axiosAuth, selectedResumeId, {
          force: forceReScore,
        })
        if (res.success && res.payload) {
          setResult(res.payload)
          void queryClient.invalidateQueries({ queryKey: ["resumes"] })
        }
      } catch (err) {
        setError(
          err instanceof CVScoringError
            ? err.message
            : "Failed to score CV. Please try again."
        )
      } finally {
        setIsLoading(false)
      }
    },
    [axiosAuth, selectedResumeId, queryClient]
  )

  const canScoreFile = !!selectedFile && !isLoading
  const canScoreExisting = !!selectedResumeId && !isLoading && resumes.length > 0

  // When user selects a resume that already has a stored score, load the full result (breakdown, suggestions) from cache so they see it without clicking.
  useEffect(() => {
    if (tab !== "existing") return
    if (!selectedResumeId) {
      setResult(null)
      return
    }
    setResult(null)
    if (!hasStoredScore || isLoading) return
    let isMounted = true
    getResumeScore(axiosAuth, selectedResumeId)
      .then((res) => {
        if (!isMounted || !res.success || !res.payload) return
        setResult(res.payload)
        setError(null)
      })
      .catch(() => {
        if (!isMounted) return
        // Ignore: user can still click "Score my CV" to retry
      })
    return () => {
      isMounted = false
    }
  }, [tab, selectedResumeId, hasStoredScore, axiosAuth])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">CV Checker</h1>
            <p className="text-sm text-muted-foreground">
              Get an AI-powered score for your CV (0–100) with breakdown and
              suggestions. Upload a file or score an existing resume.
            </p>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "existing")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <FileUp className="size-4" />
                Score from file
              </TabsTrigger>
              <TabsTrigger value="existing">
                <FileCheck className="size-4" />
                Score existing resume
              </TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="mt-4">
              <section className="relative">
                <div
                  className={cn(
                    "space-y-4",
                    isLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <CVFileDropZone onFileSelect={setSelectedFile} />
                  <div className="space-y-2">
                    <Label htmlFor="save-score-resume" className="text-xs text-muted-foreground">
                      Save score to existing resume (optional)
                    </Label>
                    <Select
                      value={saveScoreToResumeId}
                      onValueChange={setSaveScoreToResumeId}
                      disabled={resumesQuery.isPending}
                    >
                      <SelectTrigger id="save-score-resume">
                        <SelectValue placeholder="Don't save" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SAVE_SCORE_NONE}>Don't save</SelectItem>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.entities?.NAME?.[0] ?? resume.id.slice(0, 8) + "..."}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF or images (PNG, JPEG, WebP) up to 5 MB.
                  </p>
                  <Button
                    onClick={scoreFromFile}
                    disabled={!canScoreFile}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Scoring...
                      </>
                    ) : (
                      "Score my CV"
                    )}
                  </Button>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                    <AIExtractionLoader message="Analyzing your CV" />
                  </div>
                )}
              </section>
            </TabsContent>
            <TabsContent value="existing" className="mt-4">
              <section className="relative">
                <div
                  className={cn(
                    "space-y-4",
                    isLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <div className="space-y-2">
                    <Label htmlFor="resume-select">Resume</Label>
                    <Select
                      value={selectedResumeId}
                      onValueChange={setSelectedResumeId}
                      disabled={resumesQuery.isPending}
                    >
                      <SelectTrigger id="resume-select">
                        <SelectValue
                          placeholder={
                            resumesQuery.isPending
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
                    <p className="text-xs text-muted-foreground">
                      Score an existing CV using its stored text.
                    </p>
                    {selectedResumeId && hasStoredScore && !result && (
                      <p className="text-xs text-muted-foreground">
                        This resume has a stored score
                        {selectedResume?.cv_score != null && (
                          <>: {Math.round(selectedResume.cv_score)} / 100</>
                        )}
                        {selectedResume?.cv_scored_at && (
                          <> (scored {new Date(selectedResume.cv_scored_at).toLocaleDateString(undefined, { dateStyle: "short" })})</>
                        )}
                        . Loading full breakdown…
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => scoreExistingResume(hasStoredScore)}
                    disabled={!canScoreExisting}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {hasStoredScore ? "Refreshing..." : "Scoring..."}
                      </>
                    ) : hasStoredScore ? (
                      "Refresh score"
                    ) : (
                      "Score my CV"
                    )}
                  </Button>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                    <AIExtractionLoader message={hasStoredScore ? "Refreshing score" : "Analyzing your CV"} />
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>

          {result && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-foreground">
                Score result
              </h2>
              {scoreSavedToResume && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Score saved to resume.
                </p>
              )}
              <ScoreResultCard payload={result} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
