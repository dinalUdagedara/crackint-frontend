import { FileUp, Pencil } from "lucide-react"
import type { ResumeExtractResult } from "@/types/api.types"
import { Button } from "@/components/ui/button"

const ENTITY_LABELS: Record<string, string> = {
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

type ExtractedEntitiesCardProps = {
  payload: ResumeExtractResult
  onReplace: () => void
  onEdit?: () => void
}

export function ExtractedEntitiesCard({
  payload,
  onReplace,
  onEdit,
}: ExtractedEntitiesCardProps) {
  const entities = payload.entities ?? {}
  const entries = Object.entries(entities).filter(
    ([, values]) => values && values.length > 0,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="shrink-0 rounded-lg"
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onReplace}
          className="shrink-0 rounded-lg"
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
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            {entries.map(([key, values]) => (
              <div key={key}>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {ENTITY_LABELS[key] ?? key}
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
  )
}

