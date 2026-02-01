"use client"

import { MessageCircle, ShieldAlert, Sparkles } from "lucide-react"
import type { Summary } from "./summaries-hardcoded"
import { cn } from "@/lib/utils"

const iconMap = {
  messages: MessageCircle,
  sparkles: Sparkles,
  shield: ShieldAlert,
}

type SummaryCardProps = {
  summary: Summary
  className?: string
}

export default function SummaryCard({ summary, className }: SummaryCardProps) {
  const Icon = iconMap[summary.icon]

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-card-foreground">
          <Icon className="size-5" />
        </div>
        <h2 className="text-base font-semibold">{summary.title}</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {summary.items.map((item, index) => (
          <li key={index}>
            <button
              type="button"
              className="w-full rounded-lg bg-muted/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
