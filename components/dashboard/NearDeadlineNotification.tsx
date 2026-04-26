"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Bell, Calendar, Video } from "lucide-react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getNearDeadlineJobPostings } from "@/services/job-postings.service"
import type { JobPosting, NearDeadlineItem } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

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

export function NearDeadlineNotification() {
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()

  const { data } = useQuery({
    queryKey: ["job-postings", "near-deadline", 7],
    queryFn: async () => {
      const res = await getNearDeadlineJobPostings(axiosAuth, 7)
      return res.payload ?? []
    },
    enabled: status === "authenticated",
  })

  const items = data ?? []
  const count = items.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          aria-label={
            count > 0
              ? `${count} deadline or interview coming up`
              : "Upcoming deadlines and interviews"
          }
        >
          <Bell className="size-4" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 size-5 rounded-full p-0 text-xs font-medium"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {items.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No deadlines or interviews in the next 7 days
          </div>
        ) : (
          <ScrollArea className="max-h-[min(60vh,320px)]">
            <div className="flex flex-col py-1">
              {items.map((item) => (
                <DropdownMenuItem key={item.job.id} asChild>
                  <Link
                    href={`/job-postings/${item.job.id}`}
                    className="flex flex-col items-start gap-0.5 px-3 py-2"
                  >
                    <span className="font-medium text-foreground">
                      {getJobTitle(item.job)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getCompany(item.job)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
                      {item.next_milestone_type === "interview" ? (
                        <Video className="size-3.5" />
                      ) : (
                        <Calendar className="size-3.5" />
                      )}
                      {formatMilestone(item)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
