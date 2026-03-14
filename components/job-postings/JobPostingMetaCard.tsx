"use client"

import { formatDate } from "@/lib/utils"
import type { JobPosting } from "@/types/api.types"

interface JobPostingMetaCardProps {
  job: Pick<JobPosting, "id" | "created_at" | "updated_at" | "deadline">
}

export function JobPostingMetaCard({ job }: JobPostingMetaCardProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
      <dl className="space-y-1.5">
        <div className="flex gap-2">
          <dt className="w-28 text-xs text-muted-foreground">Job ID</dt>
          <dd className="font-mono text-xs text-foreground">{job.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 text-xs text-muted-foreground">Created</dt>
          <dd className="text-foreground">{formatDate(job.created_at)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 text-xs text-muted-foreground">Updated</dt>
          <dd className="text-foreground">{formatDate(job.updated_at)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 text-xs text-muted-foreground">Deadline</dt>
          <dd className="text-foreground">{formatDate(job.deadline)}</dd>
        </div>
      </dl>
    </div>
  )
}
