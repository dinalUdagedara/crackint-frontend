"use client"

import { useRouter } from "next/navigation"
import { MessageCircle, ShieldAlert, Sparkles } from "lucide-react"
import type { Summary } from "./summaries-hardcoded"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

const iconMap = {
  messages: MessageCircle,
  sparkles: Sparkles,
  shield: ShieldAlert,
}

const MAX_ITEMS_PER_CARD = 3

type SummaryCardProps = {
  summary: Summary
  className?: string
  maxItems?: number
}

export default function SummaryCard({
  summary,
  className,
  maxItems = MAX_ITEMS_PER_CARD,
}: SummaryCardProps) {
  const Icon = iconMap[summary.icon]
  const router = useRouter()
  const items = summary.items.slice(0, maxItems)

  function resolveHref(item: Summary["items"][number]): string | undefined {
    if (item.href) return item.href
    if (item.session_id) return `/sessions/${item.session_id}`
    if (item.resume_id) return `/resumes/${item.resume_id}`
    if (item.job_posting_id) return `/job-postings/${item.job_posting_id}`
    return undefined
  }

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 border-border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <h2 className="min-w-0 truncate text-base font-semibold">{summary.title}</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={index}>
            <button
              type="button"
              className="w-full cursor-pointer rounded-lg border border-border/50 bg-muted/60 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted hover:border-border"
              onClick={() => {
                const href = resolveHref(item)
                if (href) {
                  router.push(href)
                }
              }}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
