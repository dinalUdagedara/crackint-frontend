"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Circle, Loader2, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getPrepPlan } from "@/services/job-postings.service"
import type { PrepPlanTask } from "@/types/api.types"
import { cn } from "@/lib/utils"
import { planTaskHref, startPlanTask } from "./start-plan-task"

function formatDay(isoDate: string): string {
  // Parse as a local calendar date (not UTC midnight).
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

export function JobPostingPrepPlanSection({ jobPostingId }: { jobPostingId: string }) {
  const axiosAuth = useAxiosAuth()
  const router = useRouter()
  const { status } = useSession()
  const [startingDay, setStartingDay] = useState<number | null>(null)

  const { data: plan, isPending, isError } = useQuery({
    queryKey: ["prep-plan", jobPostingId],
    queryFn: async () => (await getPrepPlan(axiosAuth, jobPostingId)).payload,
    enabled: status === "authenticated",
  })

  async function handleStart(task: PrepPlanTask) {
    if (!plan || startingDay != null) return
    setStartingDay(task.day_index)
    try {
      const sessionId = await startPlanTask(axiosAuth, plan, task)
      router.push(`/sessions/${sessionId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the session.")
      setStartingDay(null)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div>
        <h2 className="text-sm font-medium">Prep plan</h2>
        <p className="text-xs text-muted-foreground">
          {plan?.target_date && plan.days_left != null
            ? `${plan.target_type === "interview" ? "Interview" : "Deadline"} on ${formatDay(plan.target_date)} · ${
                plan.days_left === 0 ? "today" : `${plan.days_left} day${plan.days_left === 1 ? "" : "s"} left`
              }. Updates as you practice.`
            : "A day-by-day plan built from your skill gaps, weak topics and scores."}
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError || !plan ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the prep plan.</p>
      ) : plan.tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Set an interview date or application deadline to get a day-by-day plan.
        </p>
      ) : (
        <ol className="space-y-2">
          {plan.tasks.map((task) => {
            const href = planTaskHref(plan, task)
            const isPast = !task.is_today && task.date < (plan.tasks.find((t) => t.is_today)?.date ?? "")
            return (
              <li
                key={task.day_index}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-2",
                  task.is_today ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/40",
                  isPast && "opacity-60"
                )}
              >
                {task.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="Done" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Not done" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.is_today ? "Today" : formatDay(task.date)} · {task.minutes} min
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                {href ? (
                  <Button variant="outline" size="xs" asChild>
                    <Link href={href}>Open</Link>
                  </Button>
                ) : (
                  task.kind !== "day_of" || task.is_today ? (
                    <Button
                      variant={task.is_today && !task.done ? "default" : "outline"}
                      size="xs"
                      onClick={() => handleStart(task)}
                      disabled={startingDay != null}
                    >
                      {startingDay === task.day_index ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Play className="size-3" />
                      )}
                      Start
                    </Button>
                  ) : null
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
