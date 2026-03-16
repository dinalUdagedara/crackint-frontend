"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, FileUp, FileText, Loader2, AlertCircle, ClipboardList } from "lucide-react"
import { AIExtractionLoader } from "@/components/cv-upload/AIExtractionLoader"
import CVFileDropZone from "@/components/cv-upload/CVFileDropZone"
import CVPasteArea from "@/components/cv-upload/CVPasteArea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  extractJobFromFile,
  extractJobFromText,
  JobExtractError,
} from "@/services/job-extractor.service"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { createJobPosting } from "@/services/job-postings.service"
import type { JobExtractPayload } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ExtractedJobEntitiesCard } from "./ExtractedJobEntitiesCard"
import { EditJobEntitiesDialog } from "./EditJobEntitiesDialog"

export default function JobUploadView({ userId: _userId }: { userId?: string | null }) {
  const axiosAuth = useAxiosAuth()
  const router = useRouter()
  const [pasteText, setPasteText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [useValidation, setUseValidation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobExtractPayload | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

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
      performExtraction(() =>
        extractJobFromFile(selectedFile, useValidation)
      )
    } else if (trimmed) {
      performExtraction(() =>
        extractJobFromText(trimmed, useValidation)
      )
    }
  }, [selectedFile, pasteText, canExtract, performExtraction, useValidation])

  const handleReplaceJobPoster = useCallback(() => {
    setResult(null)
    setSaveError(null)
  }, [])

  const hasExtractedResult = !!result

  async function handleSaveJobPosting() {
    if (!result || isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const location =
        result.entities?.LOCATION?.[0] ??
        // Fallback if extractor uses CITY instead of LOCATION
        (result as any).entities?.CITY?.[0] ??
        null

      const response = await createJobPosting(axiosAuth, {
        user_id: null,
        entities: result.entities ?? {},
        raw_text: result.raw_text ?? null,
        location,
        deadline: null,
      })

      if (response.success && response.payload) {
        router.push(`/job-postings/${response.payload.id}`)
      } else {
        setSaveError("Failed to save job posting. Please try again.")
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save job posting."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/40 via-muted/20 to-transparent p-6 shadow-sm md:p-8">
            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Upload job poster
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a PDF or image of the job poster, or paste the job
                  description text. We&apos;ll extract key information for interview prep.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {hasExtractedResult ? (
            <>
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Extracted information</CardTitle>
                  <CardDescription>
                    Review and edit the data we extracted from the job poster, or replace it with a new file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExtractedJobEntitiesCard
                    payload={result!}
                    onReplace={handleReplaceJobPoster}
                    onEdit={() => setShowEditDialog(true)}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">What&apos;s next?</CardTitle>
                  <CardDescription>
                    Save this job posting to use it in prep sessions, start interview prep, or go back to the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleSaveJobPosting}
                      disabled={isSaving}
                      className="rounded-xl"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving job posting...
                        </>
                      ) : (
                        "Save as job posting"
                      )}
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href="/sessions">
                        Start interview prep
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href="/">Back to dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {result && (
                <EditJobEntitiesDialog
                  axiosAuth={axiosAuth}
                  extracted={result}
                  open={showEditDialog}
                  onOpenChange={setShowEditDialog}
                  onSaveLocal={(updated) => {
                    setResult(updated)
                  }}
                />
              )}

              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Replace job poster</CardTitle>
                  <CardDescription>
                    Upload a new file or paste different job description text to re-extract.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div
                      className={cn(
                        "space-y-5",
                        isLoading && "pointer-events-none opacity-60"
                      )}
                    >
                      <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
                          <TabsTrigger
                            value="upload"
                            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                          >
                            <FileUp className="size-4 hidden sm:block" />
                            Upload file
                          </TabsTrigger>
                          <TabsTrigger
                            value="paste"
                            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                          >
                            <FileText className="size-4 hidden sm:block" />
                            Paste text
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-5 space-y-1.5">
                          <Label className="text-sm font-medium">New job poster file</Label>
                          <CVFileDropZone
                            variant="job"
                            onFileSelect={handleFileSelect}
                          />
                        </TabsContent>
                        <TabsContent value="paste" className="mt-5 space-y-1.5">
                          <Label className="text-sm font-medium">Paste new job description</Label>
                          <CVPasteArea
                            id="job-paste-replace"
                            label=""
                            value={pasteText}
                            onChange={(value) => {
                              setPasteText(value)
                              setError(null)
                            }}
                            placeholder="Paste new job description text to replace..."
                          />
                        </TabsContent>
                      </Tabs>
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useValidation}
                            onChange={(e) =>
                              setUseValidation(e.target.checked)
                            }
                            className="size-4 rounded border-input"
                          />
                          <span className="text-sm font-medium">Use AI validation (more accurate, slower)</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                          AI validation may improve completeness; if unavailable,
                          standard extraction is used automatically.
                        </p>
                      </div>
                      <Button
                        onClick={handleExtractClick}
                        disabled={isLoading || !canExtract}
                        variant="outline"
                        className="w-full rounded-xl md:w-auto md:min-w-[140px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {useValidation ? "Validating..." : "Extracting..."}
                          </>
                        ) : (
                          "Extract"
                        )}
                      </Button>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                        <AIExtractionLoader
                          message={
                            useValidation
                              ? "Extracting and validating with AI"
                              : "Analyzing job description"
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">How would you like to add your job poster?</CardTitle>
                <CardDescription>
                  Upload a PDF or image, or paste the job description text. We&apos;ll extract key information for interview prep.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div
                    className={cn(
                      "space-y-5",
                      isLoading && "pointer-events-none opacity-60"
                    )}
                  >
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
                        <TabsTrigger
                          value="upload"
                          className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <FileUp className="size-4 hidden sm:block" />
                          Upload file
                        </TabsTrigger>
                        <TabsTrigger
                          value="paste"
                          className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <FileText className="size-4 hidden sm:block" />
                          Paste text
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-5 space-y-1.5">
                        <Label className="text-sm font-medium">Upload your job poster</Label>
                        <CVFileDropZone
                          variant="job"
                          onFileSelect={handleFileSelect}
                        />
                        <p className="text-xs text-muted-foreground">
                          PDF or images (PNG, JPEG, WebP) up to 5 MB.
                        </p>
                      </TabsContent>
                      <TabsContent value="paste" className="mt-5 space-y-1.5">
                        <Label className="text-sm font-medium">Paste job description text</Label>
                        <CVPasteArea
                          id="job-paste"
                          label=""
                          value={pasteText}
                          onChange={(value) => {
                            setPasteText(value)
                            setError(null)
                          }}
                          placeholder="Paste job description text here..."
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useValidation}
                          onChange={(e) => setUseValidation(e.target.checked)}
                          className="size-4 rounded border-input"
                        />
                        <span className="text-sm font-medium">Use AI validation (more accurate, slower)</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        AI validation may improve completeness; if unavailable,
                        standard extraction is used automatically.
                      </p>
                    </div>
                    <Button
                      onClick={handleExtractClick}
                      disabled={isLoading || !canExtract}
                      className="w-full rounded-xl md:w-auto md:min-w-[180px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {useValidation ? "Validating..." : "Extracting..."}
                        </>
                      ) : (
                        "Extract"
                      )}
                    </Button>
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                      <AIExtractionLoader
                        message={
                          useValidation
                            ? "Extracting and validating with AI"
                            : "Analyzing job description"
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
