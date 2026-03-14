"use client"

interface JobPostingEntitiesCardProps {
  entities: Record<string, string[]> | null | undefined
}

export function JobPostingEntitiesCard({ entities }: JobPostingEntitiesCardProps) {
  const entries = Object.entries(entities ?? {})

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Extracted fields
      </h2>
      <div className="space-y-1.5">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No structured entities stored for this job.
          </p>
        ) : (
          entries.map(([key, values]) => (
            <div key={key} className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {key.replace(/_/g, " ")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <span
                    key={v}
                    className="inline-flex rounded-md border bg-background px-2.5 py-1 text-xs text-foreground"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
