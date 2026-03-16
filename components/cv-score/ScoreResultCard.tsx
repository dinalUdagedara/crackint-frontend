import type { CVScorePayload } from "@/types/api.types"

type ScoreResultCardProps = {
  payload: CVScorePayload
}

export function ScoreResultCard({ payload }: ScoreResultCardProps) {
  const { score, breakdown, suggestions, scored_at } = payload
  const hasBreakdown =
    breakdown &&
    (breakdown.content != null ||
      breakdown.structure != null ||
      breakdown.clarity != null)

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        {scored_at && (
          <span className="text-xs text-muted-foreground">
            Last scored {new Date(scored_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
          </span>
        )}
        {hasBreakdown && (
          <div className="flex flex-wrap gap-3 text-sm">
            {breakdown.content != null && (
              <span className="text-muted-foreground">
                Content: <strong>{breakdown.content}</strong>
              </span>
            )}
            {breakdown.structure != null && (
              <span className="text-muted-foreground">
                Structure: <strong>{breakdown.structure}</strong>
              </span>
            )}
            {breakdown.clarity != null && (
              <span className="text-muted-foreground">
                Clarity: <strong>{breakdown.clarity}</strong>
              </span>
            )}
          </div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">Suggestions</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

