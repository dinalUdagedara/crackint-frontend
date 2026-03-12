"use client"

import { cn } from "@/lib/utils"

export interface ReadinessMiniStatProps {
  label: string
  value: string
  tone?: "low" | "medium" | "high" | null
}

export function ReadinessMiniStat({ label, value, tone }: ReadinessMiniStatProps) {
  const className =
    tone === "high"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "medium"
        ? "text-blue-600 dark:text-blue-400"
        : tone === "low"
          ? "text-emerald-600 dark:text-emerald-400"
          : ""
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", className)}>{value}</span>
    </div>
  )
}
