"use client"

import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { OnboardingStep } from "@/types/api.types"
import { cn } from "@/lib/utils"

/** Getting-started steps for new users; hidden once every step is done. */
export default function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length
  if (!steps.length || doneCount === steps.length) return null
  const next = steps.find((s) => !s.done)

  return (
    <Card className="flex flex-col gap-3 border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Get started</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                step.done
                  ? "border-transparent text-muted-foreground line-through"
                  : step.id === next?.id
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border/60 hover:bg-muted"
              )}
              aria-current={step.id === next?.id ? "step" : undefined}
            >
              {step.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              {step.title}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  )
}
