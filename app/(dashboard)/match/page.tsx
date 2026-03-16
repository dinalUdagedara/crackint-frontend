import { Suspense } from "react"
import { MatchView } from "@/components/match/MatchView"
import { Loader2 } from "lucide-react"

export default function MatchPage() {
  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <MatchView />
        </Suspense>
      </div>
    </main>
  )
}
