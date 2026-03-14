"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JobPosting } from "@/types/api.types"

interface JobPostingDetailHeaderProps {
  job: JobPosting
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

export function JobPostingDetailHeader({
  job,
  onEdit,
  onDelete,
  isDeleting = false,
}: JobPostingDetailHeaderProps) {
  const title = job.entities?.JOB_TITLE?.[0] ?? "Job posting"
  const company = job.entities?.COMPANY?.[0] ?? "Unknown company"
  const location = job.location ?? job.entities?.LOCATION?.[0] ?? "Location unknown"

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {company} • {location}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}
