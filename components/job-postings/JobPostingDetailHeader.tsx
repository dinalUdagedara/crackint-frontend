"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { JobPosting } from "@/types/api.types"

interface JobPostingDetailHeaderProps {
  job: JobPosting
  /** If set, Edit button links to this URL (e.g. edit page). Otherwise onEdit is used. */
  editHref?: string
  onEdit?: () => void
  onDelete: () => void
  isDeleting?: boolean
}

export function JobPostingDetailHeader({
  job,
  editHref,
  onEdit,
  onDelete,
  isDeleting = false,
}: JobPostingDetailHeaderProps) {
  const title = job.entities?.JOB_TITLE?.[0] ?? "Job posting"
  const company = job.entities?.COMPANY?.[0] ?? "Unknown company"
  const location = job.location?.trim() || job.entities?.LOCATION?.[0]?.trim() || null
  const locationMissing = !location

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {company}
          {location ? ` • ${location}` : null}
        </p>
        {locationMissing && editHref && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
              Location: Not specified
            </Badge>
            <span className="text-xs text-muted-foreground">
              Job location not specified. Ask the recruiter or check the original posting.
            </span>
            <Link
              href={editHref}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Set location
            </Link>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {editHref ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={editHref}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
        )}
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
