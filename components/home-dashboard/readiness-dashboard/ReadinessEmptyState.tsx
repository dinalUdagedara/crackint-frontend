"use client"

import type { LucideIcon } from "lucide-react"

export interface ReadinessEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function ReadinessEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: ReadinessEmptyStateProps) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
      <Icon className="size-8 text-muted-foreground/70" aria-hidden />
      <div className="space-y-1 min-w-0 w-full">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground wrap-break-word">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
