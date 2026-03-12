"use client"

import type { ReadinessTrend } from "@/types/api.types"
import { Badge } from "@/components/ui/badge"

export interface ReadinessTrendBadgeProps {
  trend: ReadinessTrend
}

export function ReadinessTrendBadge({ trend }: ReadinessTrendBadgeProps) {
  const label =
    trend === "improving"
      ? "Improving"
      : trend === "declining"
        ? "Declining"
        : "Stable"
  const variant =
    trend === "improving"
      ? "default"
      : trend === "declining"
        ? "destructive"
        : "outline"
  return (
    <Badge variant={variant as "default" | "destructive" | "outline"} className="text-xs">
      {label}
    </Badge>
  )
}
