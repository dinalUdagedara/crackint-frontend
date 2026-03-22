"use client"

import { useState } from "react"
import type { AxiosInstance } from "axios"
import { Loader2, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { CoverImageField } from "./CoverImageField"

const COVER_GRADIENTS = [
  "bg-linear-to-br from-primary/40 via-primary/20 to-muted/50",
  "bg-linear-to-br from-primary/30 to-muted/60",
  "bg-linear-to-br from-muted/50 via-primary/20 to-primary/40",
  "bg-linear-to-br from-primary/25 to-muted/40",
  "bg-linear-to-br from-muted/40 to-primary/30",
]

function getCoverGradient(jobId: string): string {
  let n = 0
  for (let i = 0; i < jobId.length; i++) n += jobId.charCodeAt(i)
  return COVER_GRADIENTS[Math.abs(n) % COVER_GRADIENTS.length] ?? COVER_GRADIENTS[0]
}

function getInitial(job: JobPosting): string {
  const company = job.entities?.COMPANY?.[0]
  if (company?.length) return company.slice(0, 1).toUpperCase()
  const title = job.entities?.JOB_TITLE?.[0]
  if (title?.length) return title.slice(0, 1).toUpperCase()
  return "J"
}

export type JobPostingCoverWithEditProps = {
  job: JobPosting
  axiosAuth: AxiosInstance
  onCoverUpdate: (updated: JobPosting) => void
  onError?: (message: string) => void
  onSuccess?: (message: string) => void
}

export function JobPostingCoverWithEdit({
  job,
  axiosAuth,
  onCoverUpdate,
  onError,
  onSuccess,
}: JobPostingCoverWithEditProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [coverUrl, setCoverUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const openDialog = () => {
    setCoverUrl(job.cover_image_url ?? "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateJobPosting(axiosAuth, job.id, {
        cover_image_url: coverUrl.trim() || null,
      })
      if (res.success && res.payload) {
        onCoverUpdate(res.payload)
        setDialogOpen(false)
        onSuccess?.("Cover image updated")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update cover"
      onError?.(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="relative h-40 overflow-hidden rounded-xl">
        {job.cover_image_url ? (
          <img
            src={job.cover_image_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-background">
            <div
              className={`absolute inset-0 ${getCoverGradient(job.id)}`}
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <span className="text-6xl font-bold text-primary">
                {getInitial(job)}
              </span>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            variant="secondary"
            className="gap-2 shadow-sm"
            onClick={openDialog}
          >
            <PencilLine className="size-4" />
            Edit cover
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit cover image</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <CoverImageField
              idPrefix="cover-dialog"
              value={coverUrl}
              onChange={setCoverUrl}
              axiosAuth={axiosAuth}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
