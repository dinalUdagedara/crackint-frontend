"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Calendar, Video, ChevronRight, CheckCircle2, Loader2, Play } from "lucide-react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getNearDeadlineJobPostings, getPrepPlan } from "@/services/job-postings.service"
import { planTaskHref, startPlanTask } from "@/components/job-postings/start-plan-task"
import type { JobPosting, NearDeadlineItem } from "@/types/api.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const PREP_SCHEDULE_DAYS = 14
const MAX_ITEMS = 5

function getJobTitle(job: JobPosting): string {
  const title = job.entities?.JOB_TITLE?.[0]?.trim()
  return title ?? "Unknown job"
}

function getCompany(job: JobPosting): string {
  const company = job.entities?.COMPANY?.[0]?.trim()
  return company ?? "Company"
}

function formatMilestone(item: NearDeadlineItem): string {
  const { days_until, next_milestone_type } = item
  const label = next_milestone_type === "interview" ? "Interview" : "Deadline"
  if (days_until === 0) return `${label} today`
  if (days_until === 1) return `${label} tomorrow`
  return `${label} in ${days_until} days`
}

/** Today's task from the job's prep plan, with a one-click start. */
function TodayTask({ jobPostingId }: { jobPostingId: string }) {
  const axiosAuth = useAxiosAuth()
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)
  const { data: plan } = useQuery({
    queryKey: ["prep-plan", jobPostingId],
    queryFn: async () => (await getPrepPlan(axiosAuth, jobPostingId)).payload,
  })
  const task = plan?.tasks.find((t) => t.is_today)
  if (!plan || !task) return null
  const href = planTaskHref(plan, task)

  async function handleStart() {
    if (!plan || !task || isStarting) return
    setIsStarting(true)
    try {
      router.push(`/sessions/${await startPlanTask(axiosAuth, plan, task)}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the session.")
      setIsStarting(false)
    }
  }

  return (
    <div className="ml-9 mt-1 flex items-center gap-2 text-xs">
      {task.done ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-label="Done today" />
      ) : null}
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        Today: <span className="text-foreground">{task.title}</span> · {task.minutes} min
      </span>
      {href ? (
        <Button variant="outline" size="xs" asChild>
          <Link href={href}>Open</Link>
        </Button>
      ) : (
        <Button variant={task.done ? "outline" : "default"} size="xs" onClick={handleStart} disabled={isStarting}>
          {isStarting ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
          Start
        </Button>
      )}
    </div>
  )
}

export default function PrepScheduleCard() {
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()

  const { data } = useQuery({
    queryKey: ["job-postings", "near-deadline", PREP_SCHEDULE_DAYS],
    queryFn: async () => {
      const res = await getNearDeadlineJobPostings(
        axiosAuth,
        PREP_SCHEDULE_DAYS
      )
      return res.payload ?? []
    },
    enabled: status === "authenticated",
  })

  const items = data ?? []
  const displayItems = items.slice(0, MAX_ITEMS)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">
          Prep schedule
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/job-postings" className="text-xs">
            Job tracker
            <ChevronRight className="ml-0.5 size-3.5" />
          </Link>
        </Button>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Deadlines and interviews in the next {PREP_SCHEDULE_DAYS} days
      </p>
      {displayItems.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No deadlines or interviews in the next {PREP_SCHEDULE_DAYS} days.
          Add jobs and set deadlines or interview dates in Job tracker.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {displayItems.map((item) => (
            <li key={item.job.id}>
              <Link
                href={`/job-postings/${item.job.id}`}
                className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {item.next_milestone_type === "interview" ? (
                    <Video className="size-4" />
                  ) : (
                    <Calendar className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {getJobTitle(item.job)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {getCompany(item.job)} · {formatMilestone(item)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              <TodayTask jobPostingId={item.job.id} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
