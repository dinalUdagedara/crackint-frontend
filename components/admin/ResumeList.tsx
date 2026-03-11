"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listResumes, deleteAllResumes, deleteResume } from "@/services/resume-uploader.service"
import type { Resume } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PREVIEW_LENGTH = 80

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function getPreview(resume: Resume): string {
  const name = resume.entities?.NAME?.[0]
  if (name) return name
  const raw = resume.raw_text ?? ""
  if (raw) return raw.length > PREVIEW_LENGTH ? `${raw.slice(0, PREVIEW_LENGTH)}...` : raw
  return resume.id.slice(0, 8) + "..."
}

export function ResumeList() {
  const { status: sessionStatus } = useSession()
  const axiosAuth = useAxiosAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [meta, setMeta] = useState<{
    page: number
    page_size: number
    total_pages: number
    total_items: number
  } | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)

  const fetchResumes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await listResumes(axiosAuth, page, 20)
      if (response.success && response.payload) {
        setResumes(response.payload)
        if (response.meta) {
          setMeta(response.meta)
        }
      } else {
        setResumes([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes")
      setResumes([])
    } finally {
      setIsLoading(false)
    }
  }, [page, axiosAuth])

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchResumes()
    } else if (sessionStatus === "unauthenticated") {
      setIsLoading(false)
    }
  }, [sessionStatus, fetchResumes])

  const handleDeleteAll = useCallback(async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteAllResumes(axiosAuth)
      setShowDeleteConfirm(false)
      setResumes([])
      if (meta) setMeta({ ...meta, total_items: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resumes")
    } finally {
      setIsDeleting(false)
    }
  }, [meta])

  const handleDeleteOne = useCallback(
    async (resume: Resume) => {
      setDeletingId(resume.id)
      setError(null)
      try {
        await deleteResume(axiosAuth, resume.id)
        setResumeToDelete(null)
        setResumes((prev) => prev.filter((r) => r.id !== resume.id))
        if (meta) setMeta({ ...meta, total_items: Math.max(0, meta.total_items - 1) })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete resume")
      } finally {
        setDeletingId(null)
      }
    },
    [axiosAuth, meta]
  )

  if (isLoading && resumes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total_items} resume(s)` : "Resumes"}
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/cv-upload">Upload new CV</Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={resumes.length === 0 || isDeleting}
          >
            <Trash2 className="size-4" />
            Delete all
          </Button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No resumes yet. Upload a CV from the CV Upload page.
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Preview</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {resume.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/resumes/${resume.id}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {getPreview(resume)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(resume.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setResumeToDelete(resume)}
                        disabled={!!deletingId}
                        aria-label="Delete resume"
                      >
                        {deletingId === resume.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {meta.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.total_pages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all resumes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all resumes in the database. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAll()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete all"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!resumeToDelete}
        onOpenChange={(open) => !open && setResumeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this CV?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this CV. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                resumeToDelete && handleDeleteOne(resumeToDelete)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
