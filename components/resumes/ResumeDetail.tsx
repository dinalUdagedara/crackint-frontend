"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Pencil } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getResume } from "@/services/resume-uploader.service"
import type { Resume } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import { EditEntitiesDialog } from "@/components/cv-upload/EditEntitiesDialog"

const ENTITY_LABELS: Record<string, string> = {
  NAME: "Name",
  EMAIL: "Email",
  SKILL: "Skills",
  OCCUPATION: "Occupation",
  EDUCATION: "Education",
  EXPERIENCE: "Experience",
}

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ResumeDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()

  const [resume, setResume] = useState<Resume | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    if (!id || sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") setIsLoading(false)
      return
    }
    let isMounted = true

    async function fetchResume() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getResume(axiosAuth, id)
        if (!isMounted) return
        if (res.success && res.payload) {
          setResume(res.payload)
        } else {
          setError("Resume not found")
        }
      } catch (err) {
        if (!isMounted) return
        setError(
          err instanceof Error ? err.message : "Failed to load resume"
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchResume()
  }, [id, sessionStatus, axiosAuth])

  const handleEditSave = (updated: Resume) => {
    setResume(updated)
    setShowEditDialog(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/resumes")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to My CVs
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!isLoading && !error && resume && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {resume.entities?.NAME?.[0] ?? "Resume"}
              </h1>
              <p className="text-sm text-muted-foreground">
                ID: {resume.id.slice(0, 8)}... • Created {formatDate(resume.created_at)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
          </div>

          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Meta
              </h2>
              <dl className="space-y-1.5">
                <div className="flex gap-2">
                  <dt className="w-24 text-xs text-muted-foreground">Created</dt>
                  <dd className="text-foreground">{formatDate(resume.created_at)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 text-xs text-muted-foreground">Updated</dt>
                  <dd className="text-foreground">{formatDate(resume.updated_at)}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Extracted fields
              </h2>
              <div className="space-y-1.5">
                {Object.entries(resume.entities ?? {}).filter(
                  ([_, values]) => values && values.length > 0
                ).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No extracted fields. Use Edit to add or change information.
                  </p>
                ) : (
                  Object.entries(resume.entities ?? {}).map(([key, values]) =>
                    values && values.length > 0 ? (
                      <div key={key} className="space-y-1">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {ENTITY_LABELS[key] ?? key.replace(/_/g, " ")}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {values.map((v) => (
                            <span
                              key={v}
                              className="inline-flex rounded-md border bg-background px-2.5 py-1 text-xs text-foreground"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Raw CV text</h2>
            <div className="rounded-lg border bg-muted/10 p-4 text-sm whitespace-pre-wrap">
              {resume.raw_text ? (
                resume.raw_text
              ) : (
                <span className="text-muted-foreground">
                  No raw text stored for this resume.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {resume && (
        <EditEntitiesDialog
          axiosAuth={axiosAuth}
          resume={resume}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}
