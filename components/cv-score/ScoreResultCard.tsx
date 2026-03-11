import type { CVScorePayload } from "@/types/api.types"

type ScoreResultCardProps = {
  payload: CVScorePayload
}

export function ScoreResultCard({ payload }: ScoreResultCardProps) {
  const { score, breakdown, suggestions } = payload

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-muted-foreground">
            Content: <strong>{breakdown.content}</strong>
          </span>
          <span className="text-muted-foreground">
            Structure: <strong>{breakdown.structure}</strong>
          </span>
          <span className="text-muted-foreground">
            Clarity: <strong>{breakdown.clarity}</strong>
          </span>
        </div>
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

