import { FileUp } from "lucide-react"
import type { JobExtractPayload } from "@/types/api.types"
import { Button } from "@/components/ui/button"

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

type ExtractedJobEntitiesCardProps = {
  payload: JobExtractPayload
  onReplace: () => void
}

export function ExtractedJobEntitiesCard({
  payload,
  onReplace,
}: ExtractedJobEntitiesCardProps) {
  const entities = payload.entities ?? {}
  const entries = Object.entries(entities).filter(
    ([, values]) => values && values.length > 0,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReplace}
          className="shrink-0 rounded-lg"
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
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
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
  )
}

