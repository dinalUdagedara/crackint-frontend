"use client"

interface JobPostingRawDescriptionProps {
  rawText: string | null
}

export function JobPostingRawDescription({ rawText }: JobPostingRawDescriptionProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Raw job description</h2>
      <div className="rounded-lg border bg-muted/10 p-4 text-sm whitespace-pre-wrap">
        {rawText ?? (
          <span className="text-muted-foreground">
            No raw text stored for this job posting.
          </span>
        )}
      </div>
    </div>
  )
}
