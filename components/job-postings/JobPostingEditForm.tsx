"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { AxiosInstance } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateJobPosting } from "@/services/job-postings.service"
import type { JobPosting } from "@/types/api.types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityTagInput } from "./EntityTagInput"

export const STAGE_NONE = "__none__"
export const STAGE_OPTIONS = [
  { value: STAGE_NONE, label: "—" },
  { value: "saved", label: "Saved" },
  { value: "preparing", label: "Preparing" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
]

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

export type JobPostingEditFormProps = {
  job: JobPosting
  axiosAuth: AxiosInstance
  onSave: (updated: JobPosting) => void
  onCancel?: () => void
  /** When true, show Cancel button (default true when onCancel is provided) */
  showCancel?: boolean
  /** Optional id prefix for form fields (default "edit-job") */
  idPrefix?: string
}

export function JobPostingEditForm({
  job,
  axiosAuth,
  onSave,
  onCancel,
  showCancel = true,
  idPrefix = "edit-job",
}: JobPostingEditFormProps) {
  const [entities, setEntities] = useState<Record<string, string[]>>(() => ({
    JOB_TITLE: job.entities?.JOB_TITLE ?? [],
    COMPANY: job.entities?.COMPANY ?? [],
    ...job.entities,
  }))
  const [rawText, setRawText] = useState(job.raw_text ?? "")
  const [location, setLocation] = useState(job.location ?? "")
  const [deadline, setDeadline] = useState(() => {
    if (!job.deadline) return ""
    try {
      return new Date(job.deadline).toISOString().slice(0, 16)
    } catch {
      return ""
    }
  })
  const [coverImageUrl, setCoverImageUrl] = useState(job.cover_image_url ?? "")
  const [notes, setNotes] = useState(job.notes ?? "")
  const [questionsToAsk, setQuestionsToAsk] = useState(
    job.questions_to_ask ?? ""
  )
  const [talkingPoints, setTalkingPoints] = useState(
    job.talking_points ?? ""
  )
  const [contactName, setContactName] = useState(job.contact_name ?? "")
  const [contactEmail, setContactEmail] = useState(job.contact_email ?? "")
  const [applicationUrl, setApplicationUrl] = useState(
    job.application_url ?? ""
  )
  const [interviewAt, setInterviewAt] = useState(() => {
    if (!job.interview_at) return ""
    try {
      return new Date(job.interview_at).toISOString().slice(0, 16)
    } catch {
      return ""
    }
  })
  const [stage, setStage] = useState(
    job.stage?.trim() ? job.stage : STAGE_NONE
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEntities({
      JOB_TITLE: job.entities?.JOB_TITLE ?? [],
      COMPANY: job.entities?.COMPANY ?? [],
      ...job.entities,
    })
    setRawText(job.raw_text ?? "")
    setLocation(job.location ?? "")
    setDeadline(
      job.deadline
        ? (() => {
            try {
              return new Date(job.deadline!).toISOString().slice(0, 16)
            } catch {
              return ""
            }
          })()
        : ""
    )
    setCoverImageUrl(job.cover_image_url ?? "")
    setNotes(job.notes ?? "")
    setQuestionsToAsk(job.questions_to_ask ?? "")
    setTalkingPoints(job.talking_points ?? "")
    setContactName(job.contact_name ?? "")
    setContactEmail(job.contact_email ?? "")
    setApplicationUrl(job.application_url ?? "")
    setInterviewAt(
      job.interview_at
        ? (() => {
            try {
              return new Date(job.interview_at!).toISOString().slice(0, 16)
            } catch {
              return ""
            }
          })()
        : ""
    )
    setStage(job.stage?.trim() ? job.stage! : STAGE_NONE)
  }, [job])

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
      const interviewAtPayload = interviewAt.trim()
        ? new Date(interviewAt).toISOString()
        : null
      const res = await updateJobPosting(axiosAuth, job.id, {
        entities,
        raw_text: rawText.trim() || null,
        location: location.trim() || null,
        deadline: deadlinePayload,
        cover_image_url: coverImageUrl.trim() || null,
        notes: notes.trim() || null,
        questions_to_ask: questionsToAsk.trim() || null,
        talking_points: talkingPoints.trim() || null,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        application_url: applicationUrl.trim() || null,
        interview_at: interviewAtPayload,
        stage: stage && stage !== STAGE_NONE ? stage : null,
      })
      if (res.success && res.payload) {
        onSave(res.payload)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    axiosAuth,
    job.id,
    entities,
    rawText,
    location,
    deadline,
    coverImageUrl,
    notes,
    questionsToAsk,
    talkingPoints,
    contactName,
    contactEmail,
    applicationUrl,
    interviewAt,
    stage,
    onSave,
  ])

  const singleValueKeys = ["JOB_TITLE", "COMPANY"]
  const otherEntityEntries = Object.entries(entities)
    .filter(([key]) => !singleValueKeys.includes(key))
    .sort(([a], [b]) => a.localeCompare(b))

  const showCancelButton = showCancel && onCancel

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave()
      }}
    >
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Job details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-JOB_TITLE`}>Job title</Label>
              <Input
                id={`${idPrefix}-JOB_TITLE`}
                value={(entities.JOB_TITLE ?? [])[0] ?? ""}
                onChange={(e) =>
                  handleEntityChange(
                    "JOB_TITLE",
                    e.target.value ? [e.target.value] : []
                  )
                }
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-COMPANY`}>Company</Label>
              <Input
                id={`${idPrefix}-COMPANY`}
                value={(entities.COMPANY ?? [])[0] ?? ""}
                onChange={(e) =>
                  handleEntityChange(
                    "COMPANY",
                    e.target.value ? [e.target.value] : []
                  )
                }
                placeholder="e.g. Acme Inc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-location`}>Location</Label>
              <Input
                id={`${idPrefix}-location`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, New York"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-deadline`}>Application deadline</Label>
              <Input
                id={`${idPrefix}-deadline`}
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </section>

        {otherEntityEntries.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Other extracted fields
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {otherEntityEntries.map(([key, values]) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={`${idPrefix}-${key}`}>
                    {getEntityLabel(key)}
                  </Label>
                  <EntityTagInput
                    id={`${idPrefix}-${key}`}
                    values={values ?? []}
                    onChange={(v) => handleEntityChange(key, v)}
                    placeholder={`Add ${getEntityLabel(key).toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Raw job description
          </h2>
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-raw`}>Full description text</Label>
            <Textarea
              id={`${idPrefix}-raw`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste or edit the full job description..."
              rows={8}
              className="resize-y min-h-32"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 pt-6">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Prep &amp; links
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-cover`}>Cover image URL</Label>
              <Input
                id={`${idPrefix}-cover`}
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
              <Textarea
                id={`${idPrefix}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key requirements, follow-up dates..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-questions`}>
                Questions to ask
              </Label>
              <Textarea
                id={`${idPrefix}-questions`}
                value={questionsToAsk}
                onChange={(e) => setQuestionsToAsk(e.target.value)}
                placeholder="Questions for the interviewer..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-talking`}>Talking points</Label>
              <Textarea
                id={`${idPrefix}-talking`}
                value={talkingPoints}
                onChange={(e) => setTalkingPoints(e.target.value)}
                placeholder="Key points to mention..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-contact-name`}>
                Contact name
              </Label>
              <Input
                id={`${idPrefix}-contact-name`}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Recruiter or contact name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-contact-email`}>
                Contact email
              </Label>
              <Input
                id={`${idPrefix}-contact-email`}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-application-url`}>
                Application URL
              </Label>
              <Input
                id={`${idPrefix}-application-url`}
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-interview-at`}>
                Interview date &amp; time
              </Label>
              <Input
                id={`${idPrefix}-interview-at`}
                type="datetime-local"
                value={interviewAt}
                onChange={(e) => setInterviewAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-stage`}>Stage</Label>
              <Select value={stage || STAGE_NONE} onValueChange={setStage}>
                <SelectTrigger id={`${idPrefix}-stage`} className="w-full">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
        {showCancelButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  )
}
