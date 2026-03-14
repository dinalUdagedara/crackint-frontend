"use client"

import { useCallback, useState } from "react"
import { Loader2 } from "lucide-react"
import type { AxiosInstance } from "axios"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EntityTagInput } from "./EntityTagInput"

const JOB_ENTITY_LABELS: Record<string, string> = {
  JOB_TITLE: "Job title",
  COMPANY: "Company",
  LOCATION: "Location",
  SALARY: "Salary",
  SKILLS_REQUIRED: "Skills required",
  EXPERIENCE_REQUIRED: "Experience required",
  EDUCATION_REQUIRED: "Education required",
  JOB_TYPE: "Job type",
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

function getEntityLabel(key: string): string {
  return JOB_ENTITY_LABELS[key] ?? key.replace(/_/g, " ")
}

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
  const [entities, setEntities] = useState<Record<string, string[]>>(() => {
    const fromJob = job.entities ?? {}
    return {
      JOB_TITLE: fromJob.JOB_TITLE ?? [],
      COMPANY: fromJob.COMPANY ?? [],
      ...fromJob,
    }
  })
  const [rawText, setRawText] = useState(job.raw_text ?? "")
  const [location, setLocation] = useState(job.location ?? "")
  const [deadline, setDeadline] = useState(() => {
    if (!job.deadline) return ""
    try {
      const d = new Date(job.deadline)
      return d.toISOString().slice(0, 16)
    } catch {
      return ""
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEntityChange = useCallback((key: string, values: string[]) => {
    setEntities((prev) => ({ ...prev, [key]: values }))
    setError(null)
  }, [])

  const handleSave = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const deadlinePayload = deadline.trim()
        ? new Date(deadline).toISOString()
        : null
      const res = await updateJobPosting(axiosAuth, job.id, {
        entities,
        raw_text: rawText.trim() || null,
        location: location.trim() || null,
        deadline: deadlinePayload,
      })
      if (res.success && res.payload) {
        onSave(res.payload)
        onOpenChange(false)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [axiosAuth, job.id, entities, rawText, location, deadline, onSave, onOpenChange])

  const singleValueKeys = ["JOB_TITLE", "COMPANY"]
  const otherEntityEntries = Object.entries(entities)
    .filter(([key]) => !singleValueKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ScrollArea className="h-[70vh]">
          <DialogHeader>
            <DialogTitle>Edit job posting</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-job-JOB_TITLE">Job title</Label>
              <Input
                id="edit-job-JOB_TITLE"
                value={(entities.JOB_TITLE ?? [])[0] ?? ""}
                onChange={(e) =>
                  handleEntityChange("JOB_TITLE", e.target.value ? [e.target.value] : [])
                }
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-job-COMPANY">Company</Label>
              <Input
                id="edit-job-COMPANY"
                value={(entities.COMPANY ?? [])[0] ?? ""}
                onChange={(e) =>
                  handleEntityChange("COMPANY", e.target.value ? [e.target.value] : [])
                }
                placeholder="e.g. Acme Inc."
              />
            </div>
            {otherEntityEntries.length > 0 && (
              <>
                <h3 className="text-sm font-medium">Other extracted fields</h3>
                {otherEntityEntries.map(([key, values]) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={`edit-job-${key}`}>
                      {getEntityLabel(key)}
                    </Label>
                    <EntityTagInput
                      id={`edit-job-${key}`}
                      values={values ?? []}
                      onChange={(v) => handleEntityChange(key, v)}
                      placeholder={`Add ${getEntityLabel(key).toLowerCase()}...`}
                    />
                  </div>
                ))}
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-job-location">Location</Label>
              <Input
                id="edit-job-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, New York"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-job-deadline">Deadline</Label>
              <Input
                id="edit-job-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-job-raw">Raw job description</Label>
              <Textarea
                id="edit-job-raw"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Full job description text..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
