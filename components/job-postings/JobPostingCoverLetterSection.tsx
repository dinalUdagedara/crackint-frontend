"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface JobPostingCoverLetterSectionProps {
  selectedResumeId: string
  onGenerate: () => void
  isGeneratingCoverLetter: boolean
  coverLetterContent: string
  onCoverLetterContentChange: (value: string) => void
  hasCoverLetter: boolean
  onSave: () => void
  onDelete: () => void
  isSavingCoverLetter: boolean
  isDeletingCoverLetter: boolean
  isCoverLetterLoading: boolean
  coverLetterError: string | null
}

export function JobPostingCoverLetterSection({
  selectedResumeId,
  onGenerate,
  isGeneratingCoverLetter,
  coverLetterContent,
  onCoverLetterContentChange,
  hasCoverLetter,
  onSave,
  onDelete,
  isSavingCoverLetter,
  isDeletingCoverLetter,
  isCoverLetterLoading,
  coverLetterError,
}: JobPostingCoverLetterSectionProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <h2 className="text-sm font-medium">Generate cover letter</h2>
      <p className="text-xs text-muted-foreground">
        Use your selected resume and this job posting to generate a tailored cover letter.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onGenerate}
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
      {hasCoverLetter && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSavingCoverLetter || !coverLetterContent.trim()}
          >
            {isSavingCoverLetter ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
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
          onChange={(e) => onCoverLetterContentChange(e.target.value)}
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
  )
}
