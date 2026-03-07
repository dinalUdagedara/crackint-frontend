"use client"

import { useCallback, useState } from "react"
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
import { useQuery } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function ScoreResultCard({ payload }: { payload: CVScorePayload }) {
  const { score, breakdown, suggestions } = payload
  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-muted-foreground">
            Content: <strong>{breakdown.content}</strong>
          </span>
          <span className="text-muted-foreground">
            Structure: <strong>{breakdown.structure}</strong>
          </span>
          <span className="text-muted-foreground">
            Clarity: <strong>{breakdown.clarity}</strong>
          </span>
        </div>
      </div>
      {suggestions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">Suggestions</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function CVScoreView() {
  const axiosAuth = useAxiosAuth()
  const [tab, setTab] = useState<"file" | "existing">("file")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CVScorePayload | null>(null)

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
    try {
      const res = await scoreResumeFromFile(axiosAuth, selectedFile)
      if (res.success && res.payload) {
        setResult(res.payload)
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
  }, [axiosAuth, selectedFile])

  const scoreExistingResume = useCallback(async () => {
    if (!selectedResumeId) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await getResumeScore(axiosAuth, selectedResumeId)
      if (res.success && res.payload) {
        setResult(res.payload)
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
  }, [axiosAuth, selectedResumeId])

  const canScoreFile = !!selectedFile && !isLoading
  const canScoreExisting = !!selectedResumeId && !isLoading && resumes.length > 0

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
                  </div>
                  <Button
                    onClick={scoreExistingResume}
                    disabled={!canScoreExisting}
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
          </Tabs>

          {result && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-foreground">
                Score result
              </h2>
              <ScoreResultCard payload={result} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
