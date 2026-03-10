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
import { updateResumeEntities } from "@/services/resume-uploader.service"
import type { Resume, ResumeEntityKey } from "@/types/api.types"
import { ScrollArea } from "../ui/scroll-area"
import { EntityTagInput } from "./EntityTagInput"

const ENTITY_KEYS: ResumeEntityKey[] = [
  "NAME",
  "EMAIL",
  "SKILL",
  "OCCUPATION",
  "EDUCATION",
  "EXPERIENCE",
]

const ENTITY_LABELS: Record<string, string> = {
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

type EditEntitiesDialogProps = {
  axiosAuth: AxiosInstance
  resume: Resume
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updated: Resume) => void
}

export function EditEntitiesDialog({
  axiosAuth,
  resume,
  open,
  onOpenChange,
  onSave,
}: EditEntitiesDialogProps) {
  const [entities, setEntities] = useState<Record<string, string[]>>(() =>
    ENTITY_KEYS.reduce(
      (acc, key) => {
        acc[key] = resume.entities[key] ?? []
        return acc
      },
      {} as Record<string, string[]>
    )
  )
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
    const hasId = !!resume.id
    if (!hasId) {
      onSave({ ...resume, entities })
      onOpenChange(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await updateResumeEntities(axiosAuth, resume.id, entities)
      if (response.success && response.payload) {
        onSave(response.payload)
        onOpenChange(false)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [axiosAuth, resume, entities, onSave, onOpenChange])

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
                <Label htmlFor={`edit-${key}`}>
                  {ENTITY_LABELS[key] ?? key}
                </Label>
                {key === "NAME" ? (
                  <Textarea
                    id={`edit-${key}`}
                    value={(entities[key] ?? []).join(" ")}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      handleEntityChange(key, v ? [v] : [])
                    }}
                    placeholder="Full name"
                    rows={2}
                    className="resize-none"
                  />
                ) : (
                  <EntityTagInput
                    id={`edit-${key}`}
                    values={entities[key] ?? []}
                    onChange={(values) => handleEntityChange(key, values)}
                    placeholder={`Add ${ENTITY_LABELS[key] ?? key.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
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
