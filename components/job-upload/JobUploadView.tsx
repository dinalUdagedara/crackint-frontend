"use client"

import { useCallback, useState } from "react"
import { FileUp, FileText, Loader2 } from "lucide-react"
import { AIExtractionLoader } from "@/components/cv-upload/AIExtractionLoader"
import CVFileDropZone from "@/components/cv-upload/CVFileDropZone"
import CVPasteArea from "@/components/cv-upload/CVPasteArea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  extractJobFromFile,
  extractJobFromText,
  JobExtractError,
} from "@/services/job-extractor.service"
import type { JobExtractPayload } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const JOB_ENTITY_LABELS: Record<string, string> = {
  JOB_TITLE: "Job title",
  COMPANY: "Company",
  LOCATION: "Location",
  SALARY: "Salary",
  SKILLS_REQUIRED: "Skills required",
  EXPERIENCE_REQUIRED: "Experience required",
  EDUCATION_REQUIRED: "Education required",
  JOB_TYPE: "Job type",
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

function getEntityLabel(key: string): string {
  return JOB_ENTITY_LABELS[key] ?? key.replace(/_/g, " ")
}

function ExtractedJobEntitiesCard({
  payload,
  onReplace,
}: {
  payload: JobExtractPayload
  onReplace: () => void
}) {
  const entities = payload.entities ?? {}
  const entries = Object.entries(entities).filter(
    ([_, values]) => values && values.length > 0
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">
              Extracted information
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onReplace}
              className="shrink-0"
            >
              <FileUp className="size-4" />
              Replace job poster
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No entities were extracted from the job description.
            </p>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                {entries.map(([key, values]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {getEntityLabel(key)}
                    </dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {values.map((value) => (
                        <span
                          key={value}
                          className="inline-flex rounded-md border bg-background px-2.5 py-1 text-sm text-foreground"
                        >
                          {value}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobUploadView() {
  const [pasteText, setPasteText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobExtractPayload | null>(null)

  const performExtraction = useCallback(
    async (
      extractFn: () => Promise<{
        success: boolean
        payload: JobExtractPayload | null
      }>
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await extractFn()
        if (response.success && response.payload) {
          setResult(response.payload)
          setSelectedFile(null)
          setPasteText("")
        }
      } catch (err) {
        setError(
          err instanceof JobExtractError
            ? err.message
            : "Failed to extract job description. Please try again."
        )
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file)
    setError(null)
  }, [])

  const canExtract = !!(selectedFile || pasteText.trim())

  const handleExtractClick = useCallback(() => {
    if (!canExtract) return

    const trimmed = pasteText.trim()

    if (selectedFile) {
      performExtraction(() => extractJobFromFile(selectedFile))
    } else if (trimmed) {
      performExtraction(() => extractJobFromText(trimmed))
    }
  }, [selectedFile, pasteText, canExtract, performExtraction])

  const handleReplaceJobPoster = useCallback(() => {
    setResult(null)
  }, [])

  const hasExtractedResult = !!result

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Upload job poster
            </h1>
            <p className="text-muted-foreground text-sm">
              Upload a PDF or image of the job poster, or paste the job
              description text. We&apos;ll extract key information for interview
              prep.
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

          {hasExtractedResult ? (
            <>
              <ExtractedJobEntitiesCard
                payload={result!}
                onReplace={handleReplaceJobPoster}
              />
              <section className="rounded-lg border border-dashed bg-muted/20 p-6">
                <h2 className="mb-2 text-sm font-medium text-foreground">
                  Replace job poster
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Upload a new file or paste different job description text to
                  re-extract.
                </p>
                <div
                  className={cn(
                    "relative space-y-4",
                    isLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">
                        <FileUp className="size-4" />
                        Upload file
                      </TabsTrigger>
                      <TabsTrigger value="paste">
                        <FileText className="size-4" />
                        Paste text
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4">
                      <CVFileDropZone
                        variant="job"
                        onFileSelect={handleFileSelect}
                      />
                    </TabsContent>
                    <TabsContent value="paste" className="mt-4">
                      <CVPasteArea
                        id="job-paste-replace"
                        label="Or paste job description text"
                        value={pasteText}
                        onChange={(value) => {
                          setPasteText(value)
                          setError(null)
                        }}
                        placeholder="Paste new job description text to replace..."
                      />
                    </TabsContent>
                  </Tabs>
                  <Button
                    onClick={handleExtractClick}
                    disabled={isLoading || !canExtract}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract"
                    )}
                  </Button>
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                      <AIExtractionLoader message="Analyzing job description" />
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="relative">
              <div
                className={cn(
                  "space-y-4",
                  isLoading && "pointer-events-none opacity-60"
                )}
              >
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <FileUp className="size-4" />
                      Upload file
                    </TabsTrigger>
                    <TabsTrigger value="paste">
                      <FileText className="size-4" />
                      Paste text
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <CVFileDropZone
                      variant="job"
                      onFileSelect={handleFileSelect}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      PDF or images (PNG, JPEG, WebP) up to 5 MB.
                    </p>
                  </TabsContent>
                  <TabsContent value="paste" className="mt-4">
                    <CVPasteArea
                      id="job-paste"
                      label="Or paste job description text"
                      value={pasteText}
                      onChange={(value) => {
                        setPasteText(value)
                        setError(null)
                      }}
                      placeholder="Paste job description text here..."
                    />
                  </TabsContent>
                </Tabs>
                <Button
                  onClick={handleExtractClick}
                  disabled={isLoading || !canExtract}
                  className="mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    "Extract"
                  )}
                </Button>
              </div>
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                  <AIExtractionLoader message="Analyzing job description" />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
