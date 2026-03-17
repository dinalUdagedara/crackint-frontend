"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Calendar, Video, ChevronRight } from "lucide-react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getNearDeadlineJobPostings } from "@/services/job-postings.service"
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
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
