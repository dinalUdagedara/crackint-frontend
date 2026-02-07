"use client"

import { useCallback, useRef, useState } from "react"
import { Loader2, X } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"

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

function EntityTagInput({
  values,
  onChange,
  placeholder,
  id,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  id: string
}) {
  const [inputValue, setInputValue] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const addValue = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return
      const next = [...values]
      if (next.includes(trimmed)) return
      next.push(trimmed)
      onChange(next)
      setInputValue("")
    },
    [values, onChange]
  )

  const removeValue = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index))
      if (editingIndex === index) {
        setEditingIndex(null)
        setEditingValue("")
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1)
      }
    },
    [values, onChange, editingIndex]
  )

  const updateValue = useCallback(
    (index: number, raw: string) => {
      const trimmed = raw.trim()
      const next = [...values]
      if (!trimmed) {
        next.splice(index, 1)
      } else if (next[index] !== trimmed) {
        next[index] = trimmed
      }
      onChange(next)
      setEditingIndex(null)
      setEditingValue("")
    },
    [values, onChange]
  )

  const startEditing = useCallback(
    (index: number) => {
      setEditingIndex(index)
      setEditingValue(values[index] ?? "")
      setTimeout(() => editInputRef.current?.focus(), 0)
    },
    [values]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addValue(inputValue)
      } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
        removeValue(values.length - 1)
      }
    },
    [inputValue, addValue, removeValue, values.length]
  )

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault()
        updateValue(index, editingValue)
      } else if (e.key === "Escape") {
        setEditingIndex(null)
        setEditingValue("")
        editInputRef.current?.blur()
      }
    },
    [editingValue, updateValue]
  )

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) addValue(inputValue)
  }, [inputValue, addValue])

  const handleEditBlur = useCallback(
    (index: number) => {
      updateValue(index, editingValue)
    },
    [editingValue, updateValue]
  )

  return (
    <div
      onClick={() => {
        if (editingIndex === null) inputRef.current?.focus()
      }}
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-3 py-2",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      )}
    >
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="contents">
          {editingIndex === index ? (
            <Input
              ref={editInputRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, index)}
              onBlur={() => handleEditBlur(index)}
              onClick={(e) => e.stopPropagation()}
              className="h-8 min-w-[60px] max-w-[200px] shrink-0 px-2 py-1 text-sm"
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation()
                startEditing(index)
              }}
              className="inline-flex cursor-text items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm hover:bg-muted/80"
            >
              {value}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 rounded p-0 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  removeValue(index)
                }}
                aria-label={`Remove ${value}`}
              >
                <X className="size-3" />
              </Button>
            </span>
          )}
        </span>
      ))}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={values.length === 0 ? placeholder : "Add..."}
        className="h-8 min-w-[80px] flex-1 shrink-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 px-3"
      />
    </div>
  )
}

type EditEntitiesDialogProps = {
  resume: Resume
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updated: Resume) => void
}

export function EditEntitiesDialog({
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
      const response = await updateResumeEntities(resume.id, entities)
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
  }, [resume, entities, onSave, onOpenChange])

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
