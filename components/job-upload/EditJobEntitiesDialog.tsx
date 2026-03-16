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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { JobExtractPayload, JobPosting } from "@/types/api.types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EntityTagInput } from "../cv-upload/EntityTagInput"
import { updateJobPosting } from "@/services/job-postings.service"

const ENTITY_KEYS: string[] = [
  "JOB_TITLE",
  "COMPANY",
  "LOCATION",
  "SALARY",
  "SKILLS_REQUIRED",
  "EXPERIENCE_REQUIRED",
  "EDUCATION_REQUIRED",
  "JOB_TYPE",
  "NAME",
  "EMAIL",
  "SKILL",
  "OCCUPATION",
  "EDUCATION",
  "EXPERIENCE",
]

const ENTITY_LABELS: Record<string, string> = {
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

type EditJobEntitiesDialogProps = {
  axiosAuth: AxiosInstance
  extracted: JobExtractPayload
  /** When provided, we will persist edits to this job; otherwise we only edit in memory via onSaveLocal */
  jobForUpdate?: JobPosting
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when entities have been updated, either locally or via API */
  onSaveLocal: (updated: JobExtractPayload) => void
}

export function EditJobEntitiesDialog({
  axiosAuth,
  extracted,
  jobForUpdate,
  open,
  onOpenChange,
  onSaveLocal,
}: EditJobEntitiesDialogProps) {
  const [entities, setEntities] = useState<Record<string, string[]>>(() => {
    const base = extracted.entities ?? {}
    return ENTITY_KEYS.reduce(
      (acc, key) => {
        acc[key] = base[key] ?? []
        return acc
      },
      {} as Record<string, string[]>
    )
  })
  const [rawText, setRawText] = useState(extracted.raw_text ?? "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEntityChange = useCallback((key: string, values: string[]) => {
    setEntities((prev) => ({
      ...prev,
      [key]: values,
    }))
    setError(null)
  }, [])

  const handleSave = useCallback(async () => {
    const updatedPayload: JobExtractPayload = {
      ...extracted,
      entities,
      raw_text: rawText,
    }

    // If we don't yet have a real job posting, just update locally (JobUploadView will control saving)
    if (!jobForUpdate) {
      onSaveLocal(updatedPayload)
      onOpenChange(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await updateJobPosting(axiosAuth, jobForUpdate.id, {
        entities,
        raw_text: rawText.trim() || null,
        location:
          entities.LOCATION?.[0] ??
          entities.CITY?.[0] ??
          jobForUpdate.location ??
          null,
      })
      if (res.success && res.payload) {
        onSaveLocal({
          ...updatedPayload,
          entities: res.payload.entities ?? entities,
          raw_text: res.payload.raw_text ?? rawText,
        })
        onOpenChange(false)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [axiosAuth, entities, rawText, extracted, jobForUpdate, onSaveLocal, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md ">
        <ScrollArea className="h-[70vh]">
          <DialogHeader>
            <DialogTitle>Edit extracted information</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {ENTITY_KEYS.map((key) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={`edit-job-${key}`}>
                  {ENTITY_LABELS[key] ?? key.replace(/_/g, " ")}
                </Label>
                <EntityTagInput
                  id={`edit-job-${key}`}
                  values={entities[key] ?? []}
                  onChange={(values) => handleEntityChange(key, values)}
                  placeholder={`Add ${(
                    ENTITY_LABELS[key] ?? key.replace(/_/g, " ").toLowerCase()
                  )}...`}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="edit-job-raw-text">
                Full job description
              </Label>
              <Textarea
                id="edit-job-raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste or edit the full job description..."
                rows={6}
                className="resize-y"
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

