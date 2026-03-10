"use client"

import { Suspense } from "react"
import { CoverLetterEditorView } from "@/components/cover-letter/CoverLetterEditorView"

export default function CoverLetterPage() {
  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading cover letter editor…
          </div>
        }
      >
        <CoverLetterEditorView />
      </Suspense>
    </main>
  )
}

