"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageCircle, ShieldAlert, Sparkles } from "lucide-react"
import type { HomeSummaryCard } from "@/types/api.types"
import type { Summary } from "./summaries-hardcoded"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

const EMPTY_STATE_CONFIG: Record<
  string,
  { title: string; description: string; actionLabel: string; href: string }
> = {
  jump_back_in: {
    title: "No sessions yet",
    description: "Start your first practice above to begin the journey.",
    actionLabel: "Start practice",
    href: "/sessions",
  },
  refine_cv: {
    title: "No CV suggestions yet",
    description: "Upload your CV and add a job to get tailored suggestions.",
    actionLabel: "Go to CV",
    href: "/resumes",
  },
  readiness_tracker: {
    title: "No readiness data yet",
    description: "Start a practice session to see your readiness here.",
    actionLabel: "Start practice",
    href: "/sessions",
  },
}

function getEmptyConfig(summary: Summary) {
  const id = (summary as HomeSummaryCard).id
  if (id && id in EMPTY_STATE_CONFIG) return EMPTY_STATE_CONFIG[id]
  return EMPTY_STATE_CONFIG.readiness_tracker
}

export default function SummaryCard({
  summary,
  className,
  maxItems = MAX_ITEMS_PER_CARD,
}: SummaryCardProps) {
  const Icon = iconMap[summary.icon]
  const router = useRouter()
  const items = summary.items.slice(0, maxItems)
  const isEmpty = items.length === 0
  const singleCtaItem =
    items.length === 1 &&
    (items[0] as { action_type?: string | null }).action_type != null

  function resolveHref(item: Summary["items"][number]): string | undefined {
    if (item.href) return item.href
    if (item.session_id) return `/sessions/${item.session_id}`
    if (item.resume_id) return `/resumes/${item.resume_id}`
    if (item.job_posting_id) return `/job-postings/${item.job_posting_id}`
    return undefined
  }

  function handleItemClick(item: Summary["items"][number]) {
    const href = resolveHref(item)
    if (href) router.push(href)
  }

  const emptyConfig = getEmptyConfig(summary)

  const singleCtaHref = singleCtaItem ? (resolveHref(items[0]) ?? emptyConfig.href) : null
  const singleCtaDescription =
    singleCtaItem && items[0].title.length > 45 ? items[0].title : emptyConfig.description

  return (
    <Card
      className={cn(
        "flex min-h-[200px] flex-col gap-4 border-border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3 shrink-0">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <h2 className="min-w-0 truncate text-base font-semibold">{summary.title}</h2>
      </div>

      {isEmpty ? (
        <div className="flex min-h-[120px] flex-1 flex-col justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">{emptyConfig.title}</p>
          <p className="text-xs text-muted-foreground wrap-break-word">{emptyConfig.description}</p>
          <Button asChild size="sm" variant="outline" className="mt-1 shrink-0 self-center">
            <Link href={emptyConfig.href}>{emptyConfig.actionLabel}</Link>
          </Button>
        </div>
      ) : singleCtaItem ? (
        <div className="flex min-h-[120px] flex-1 flex-col justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">{emptyConfig.title}</p>
          <p className="text-xs text-muted-foreground wrap-break-word">{singleCtaDescription}</p>
          <Button asChild size="sm" variant="outline" className="mt-1 shrink-0 self-center">
            <Link href={singleCtaHref ?? emptyConfig.href}>{emptyConfig.actionLabel}</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex min-h-[120px] flex-1 flex-col gap-2">
          {items.map((item, index) => (
            <li key={index}>
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg border border-border/50 bg-muted/60 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted hover:border-border"
                onClick={() => handleItemClick(item)}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
