import CVScoreView from "@/components/cv-score/CVScoreView"
import { ClientOnly } from "@/components/common/ClientOnly"

export default function CVScorePage() {
  return (
    <ClientOnly fallback={<div className="min-h-[200px] animate-pulse rounded-lg bg-muted/50" />}>
      <CVScoreView />
    </ClientOnly>
  )
}
