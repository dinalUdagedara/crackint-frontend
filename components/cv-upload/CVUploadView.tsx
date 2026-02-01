"use client"

import { useState } from "react"
import CVFileDropZone from "./CVFileDropZone"
import CVPasteArea from "./CVPasteArea"

export default function CVUploadView() {
  const [pasteText, setPasteText] = useState("")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Upload your CV
            </h1>
            <p className="text-muted-foreground text-sm">
              Upload a PDF or image of your CV. We&apos;ll parse it to personalize your interview prep.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Upload file
            </h2>
            <CVFileDropZone onFileSelect={() => {}} />
          </section>

          <div
            className="flex items-center gap-4"
            aria-hidden="true"
          >
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">
              or
            </span>
            <div className="flex-1 border-t" />
          </div>

          <section>
            <CVPasteArea
              value={pasteText}
              onChange={setPasteText}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
