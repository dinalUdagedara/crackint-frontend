"use client"

import { useCallback, useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import CVFileDropZone from "./CVFileDropZone"
import CVPasteArea from "./CVPasteArea"
import {
  extractResumeFromFile,
  extractResumeFromText,
  ResumeUploadError,
} from "@/services/resume-uploader.service"
import type { ResumeExtractPayload } from "@/types/api.types"
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

const ENTITY_LABELS: Record<string, string> = {
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

function ExtractedEntitiesCard({
  payload,
  onReplace,
}: {
  payload: ResumeExtractPayload
  onReplace: () => void
}) {
  const entities = payload.entities
  const entries = Object.entries(entities).filter(
    ([_, values]) => values && values.length > 0
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">

          <div className="flex justify-between items-center">
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
              Replace resume
            </Button>
          </div>



          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No entities were extracted from your CV.
            </p>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                {entries.map(([key, values]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {ENTITY_LABELS[key] ?? key}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {values.join(", ")}
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

export default function CVUploadView() {
  const [pasteText, setPasteText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeExtractPayload | null>(null)
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
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
    if (file && file.type !== "application/pdf") {
      setError(
        "Only PDF files are supported for upload. Please paste your CV text instead."
      )
      setSelectedFile(null)
    }
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
        performExtraction(() => extractResumeFromFile(selectedFile))
      }
    } else if (trimmed) {
      if (result) {
        setPendingReplace({ type: "text", text: trimmed })
        setShowReplaceConfirm(true)
      } else {
        performExtraction(() => extractResumeFromText(trimmed))
      }
    }
  }, [selectedFile, pasteText, result, canExtract, performExtraction])

  const handleConfirmReplace = useCallback(async () => {
    if (!pendingReplace) return
    if (pendingReplace.type === "file") {
      await performExtraction(() => extractResumeFromFile(pendingReplace.file))
    } else {
      await performExtraction(() =>
        extractResumeFromText(pendingReplace.text)
      )
    }
  }, [pendingReplace, performExtraction])

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

  const hasExtractedResume = !!result

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Upload your CV
            </h1>
            <p className="text-muted-foreground text-sm">
              Upload a PDF or paste your CV text. We&apos;ll extract key
              information to personalize your interview prep.
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

          {hasExtractedResume ? (
            <>
              <ExtractedEntitiesCard
                payload={result!}
                onReplace={handleReplaceResume}
              />
              <section className="rounded-lg border border-dashed bg-muted/20 p-6">
                <h2 className="mb-2 text-sm font-medium text-foreground">
                  Replace resume
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Want to use a different CV? Upload a new PDF or paste text
                  below. You&apos;ll be asked to confirm before replacing.
                </p>
                <div
                  className={cn(
                    "relative space-y-4",
                    isLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <CVFileDropZone onFileSelect={handleFileSelect} />
                  <CVPasteArea
                    value={pasteText}
                    onChange={(value) => {
                      setPasteText(value)
                      setError(null)
                    }}
                    placeholder="Paste new CV text to replace..."
                  />
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
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50">
                      <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="mb-3 text-sm font-medium text-foreground">
                  Upload file
                </h2>
                <div
                  className={cn(
                    "relative",
                    isLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <CVFileDropZone onFileSelect={handleFileSelect} />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50">
                      <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  PDF only (max 10 MB). For images, paste your CV text below.
                </p>
              </section>

              <div
                className="flex items-center gap-4"
                aria-hidden="true"
              >
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t" />
              </div>

              <section>
                <CVPasteArea
                  value={pasteText}
                  onChange={(value) => {
                    setPasteText(value)
                    setError(null)
                  }}
                />
                <Button
                  onClick={handleExtractClick}
                  disabled={isLoading || !canExtract}
                  className="mt-3"
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
              </section>
            </>
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
