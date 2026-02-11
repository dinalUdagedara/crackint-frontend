"use client"

export function AIExtractionLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Extracting resume information"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-muted/30 px-8 py-10 backdrop-blur-sm"
    >
      {/* Bouncing dots - ChatGPT style */}
      <div className="flex items-center gap-1.5">
        <span
          className="size-2 rounded-full bg-primary animate-bounce [animation-delay:0ms] animation-duration-[0.6s]"
        />
        <span
          className="size-2 rounded-full bg-primary animate-bounce [animation-delay:150ms] animation-duration-[0.6s]"
        />
        <span
          className="size-2 rounded-full bg-primary animate-bounce [animation-delay:300ms] animation-duration-[0.6s]"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Analyzing your resume
        <span className="inline-block animate-pulse">...</span>
      </p>
    </div>
  )
}
