"use client"

import type { AxiosInstance } from "axios"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { JobPosting } from "@/types/api.types"
import { JobPostingEditForm } from "./JobPostingEditForm"

type EditJobPostingDialogProps = {
  axiosAuth: AxiosInstance
  job: JobPosting
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updated: JobPosting) => void
}

export function EditJobPostingDialog({
  axiosAuth,
  job,
  open,
  onOpenChange,
  onSave,
}: EditJobPostingDialogProps) {
  const handleSave = (updated: JobPosting) => {
    onSave(updated)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <ScrollArea className="max-h-[75vh]">
          <div className="pr-4">
            <h2 className="mb-4 text-lg font-semibold">Edit job posting</h2>
            <JobPostingEditForm
              job={job}
              axiosAuth={axiosAuth}
              onSave={handleSave}
              onCancel={() => onOpenChange(false)}
              showCancel={true}
              idPrefix="edit-dialog"
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
