"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { ArrowRight, FileUp, FileText, Loader2, AlertCircle } from "lucide-react"
import { AIExtractionLoader } from "./AIExtractionLoader"
import CVFileDropZone from "./CVFileDropZone"
import CVPasteArea from "./CVPasteArea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditEntitiesDialog } from "./EditEntitiesDialog"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import {
  extractResumeFromFile,
  extractResumeFromText,
  ResumeUploadError,
} from "@/services/resume-uploader.service"
import type { Resume, ResumeExtractResult } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ExtractedEntitiesCard } from "./ExtractedEntitiesCard"

function toResume(result: ResumeExtractResult): Resume | null {
  if (!result.id) return null
  return {
    id: result.id,
    user_id: result.user_id ?? null,
    entities: result.entities ?? {},
    raw_text: result.raw_text ?? null,
    created_at: result.created_at ?? new Date().toISOString(),
    updated_at: result.updated_at ?? new Date().toISOString(),
  }
}

export default function CVUploadView() {
  const axiosAuth = useAxiosAuth()
  const [pasteText, setPasteText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeExtractResult | null>(null)
  const [useEnhancedExtraction, setUseEnhancedExtraction] = useState(false)
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [pendingReplace, setPendingReplace] = useState<
    { type: "file"; file: File } | { type: "text"; text: string } | null
  >(null)

  const resetState = useCallback(() => {
    setError(null)
    setResult(null)
    setPasteText("")
    setSelectedFile(null)
    setPendingReplace(null)
    setShowReplaceConfirm(false)
  }, [])

  const performExtraction = useCallback(
    async (
      extractFn: () => Promise<Awaited<ReturnType<typeof extractResumeFromFile>>>
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await extractFn()
        if (response.success && response.payload) {
          setResult(response.payload)
          setPendingReplace(null)
          setSelectedFile(null)
          setPasteText("")
          setShowReplaceConfirm(false)
        }
      } catch (err) {
        setError(
          err instanceof ResumeUploadError
            ? err.message
            : "Failed to extract resume. Please try again."
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
      if (result) {
        setPendingReplace({ type: "file", file: selectedFile })
        setShowReplaceConfirm(true)
      } else {
        performExtraction(() =>
          extractResumeFromFile(axiosAuth, selectedFile, useEnhancedExtraction)
        )
      }
    } else if (trimmed) {
      if (result) {
        setPendingReplace({ type: "text", text: trimmed })
        setShowReplaceConfirm(true)
      } else {
        performExtraction(() =>
          extractResumeFromText(axiosAuth, trimmed, useEnhancedExtraction)
        )
      }
    }
  }, [
    selectedFile,
    pasteText,
    result,
    canExtract,
    performExtraction,
    useEnhancedExtraction,
    axiosAuth,
  ])

  const handleConfirmReplace = useCallback(async () => {
    if (!pendingReplace) return
    if (pendingReplace.type === "file") {
      await performExtraction(() =>
        extractResumeFromFile(axiosAuth, pendingReplace.file, useEnhancedExtraction)
      )
    } else {
      await performExtraction(() =>
        extractResumeFromText(axiosAuth, pendingReplace.text, useEnhancedExtraction)
      )
    }
  }, [pendingReplace, performExtraction, useEnhancedExtraction, axiosAuth])

  const handleCancelReplace = useCallback(() => {
    setShowReplaceConfirm(false)
    setPendingReplace(null)
  }, [])

  const handleReplaceResume = useCallback(() => {
    setShowReplaceConfirm(true)
  }, [])

  const handleConfirmReplaceIntent = useCallback(() => {
    setShowReplaceConfirm(false)
    resetState()
  }, [resetState])

  const handleCancelReplaceIntent = useCallback(() => {
    setShowReplaceConfirm(false)
  }, [])

  const handleEditSave = useCallback((updated: Resume) => {
    setResult(updated)
  }, [])

  const resumeForEdit = result ? toResume(result) : null
  const hasExtractedResume = !!result

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/40 via-muted/20 to-transparent p-6 shadow-sm md:p-8">
            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileUp className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Upload your CV
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a PDF or paste your CV text. We&apos;ll extract key
                  information to personalize your interview prep.
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

          {hasExtractedResume ? (
            <>
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Extracted information</CardTitle>
                  <CardDescription>
                    Review and edit the data we extracted from your CV, or replace it with a new file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExtractedEntitiesCard
                    payload={result!}
                    onReplace={handleReplaceResume}
                    onEdit={() => setShowEditDialog(true)}
                  />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">What&apos;s next?</CardTitle>
                  <CardDescription>
                    Your CV is ready and saved. Start a prep session to practice with this
                    resume, or go back to the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild className="rounded-xl">
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

              <EditEntitiesDialog
                axiosAuth={axiosAuth}
                resume={
                  resumeForEdit ?? {
                    id: "",
                    user_id: null,
                    entities: result!.entities ?? {},
                    raw_text: result!.raw_text ?? null,
                    created_at: "",
                    updated_at: "",
                  }
                }
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSave={handleEditSave}
              />

              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Replace resume</CardTitle>
                  <CardDescription>
                    Want to use a different CV? Upload a new PDF or paste text
                    below. You&apos;ll be asked to confirm before replacing.
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
                        <Label className="text-sm font-medium">New CV file</Label>
                        <CVFileDropZone onFileSelect={handleFileSelect} />
                      </TabsContent>
                      <TabsContent value="paste" className="mt-5 space-y-1.5">
                        <Label className="text-sm font-medium">Paste new CV text</Label>
                        <CVPasteArea
                          value={pasteText}
                          onChange={(value) => {
                            setPasteText(value)
                            setError(null)
                          }}
                          placeholder="Paste new CV text to replace..."
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useEnhancedExtraction}
                          onChange={(e) =>
                            setUseEnhancedExtraction(e.target.checked)
                          }
                          className="size-4 rounded border-input"
                        />
                        <span className="text-sm font-medium">Use enhanced extraction (AI)</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enhanced extraction may improve completeness (e.g. skills); if
                        unavailable, standard extraction is used automatically.
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
                          Extracting...
                        </>
                      ) : (
                        "Extract"
                      )}
                    </Button>
                    </div>
                    {isLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                        <AIExtractionLoader message="Extracting from your CV" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">How would you like to add your CV?</CardTitle>
                <CardDescription>
                  Upload a PDF or paste your CV text. We&apos;ll extract key information for your interview prep.
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
                        <Label className="text-sm font-medium">Upload your CV</Label>
                        <CVFileDropZone onFileSelect={handleFileSelect} />
                        <p className="text-xs text-muted-foreground">
                          PDF or images (PNG, JPEG, WebP) up to 5 MB.
                        </p>
                      </TabsContent>
                      <TabsContent value="paste" className="mt-5 space-y-1.5">
                        <Label className="text-sm font-medium">Paste your CV text</Label>
                        <CVPasteArea
                          value={pasteText}
                          onChange={(value) => {
                            setPasteText(value)
                            setError(null)
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useEnhancedExtraction}
                          onChange={(e) => setUseEnhancedExtraction(e.target.checked)}
                          className="size-4 rounded border-input"
                        />
                        <span className="text-sm font-medium">Use enhanced extraction (AI)</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enhanced extraction may improve completeness (e.g. skills); if
                        unavailable, standard extraction is used automatically.
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
                          Extracting...
                        </>
                      ) : (
                        "Extract"
                      )}
                    </Button>
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                      <AIExtractionLoader message="Extracting from your CV" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingReplace
                ? "Replace current resume?"
                : "Replace resume?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingReplace
                ? "You already have extracted resume information. Replacing will overwrite it with the new file or text. Continue?"
                : "This will clear your extracted resume. You'll need to upload or paste a new CV."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={
                pendingReplace ? handleCancelReplace : handleCancelReplaceIntent
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={
                pendingReplace ? handleConfirmReplace : handleConfirmReplaceIntent
              }
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
