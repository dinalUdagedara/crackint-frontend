"use client"

import { useCallback, useState } from "react"
import { Loader2 } from "lucide-react"
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

const ENTITY_LABELS: Record<string, string> = {
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

function ExtractedEntitiesCard({ payload }: { payload: ResumeExtractPayload }) {
  const entities = payload.entities
  const entries = Object.entries(entities).filter(
    ([_, values]) => values && values.length > 0
  )

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entities were extracted from your CV.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        Extracted information
      </h3>
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
    </div>
  )
}

export default function CVUploadView() {
  const [pasteText, setPasteText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeExtractPayload | null>(null)

  const resetState = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      resetState()
      if (!file) return

      if (file.type !== "application/pdf") {
        setError(
          "Only PDF files are supported for upload. Please paste your CV text instead."
        )
        return
      }

      setIsLoading(true)
      try {
        const response = await extractResumeFromFile(file)
        if (response.success && response.payload) {
          setResult(response.payload)
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
    [resetState]
  )

  const handleExtractFromText = useCallback(async () => {
    resetState()
    const trimmed = pasteText.trim()
    if (!trimmed) {
      setError("Please paste your CV text first.")
      return
    }

    setIsLoading(true)
    try {
      const response = await extractResumeFromText(trimmed)
      if (response.success && response.payload) {
        setResult(response.payload)
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
  }, [pasteText, resetState])

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

          {result && <ExtractedEntitiesCard payload={result} />}

          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Upload file
            </h2>
            <div className={cn("relative", isLoading && "pointer-events-none opacity-60")}>
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
                resetState()
              }}
            />
            <Button
              onClick={handleExtractFromText}
              disabled={isLoading || !pasteText.trim()}
              className="mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract from text"
              )}
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
