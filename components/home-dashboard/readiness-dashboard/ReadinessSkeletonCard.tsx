"use client"

import { Card } from "@/components/ui/card"

export function ReadinessSkeletonCard() {
  return (
    <Card className="p-4 space-y-3">
      <div className="h-3 w-20 rounded bg-muted" />
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
    </Card>
  )
}
