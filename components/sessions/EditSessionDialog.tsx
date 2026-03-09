import { useState, useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { updateSession } from "@/services/sessions.service"
import type { PrepSession } from "@/types/api.types"

interface EditSessionDialogProps {
  session: PrepSession
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (updatedSession: PrepSession) => void
}

function getSessionTitle(session: PrepSession) {
  const summary = session.summary as { [key: string]: unknown } | null
  const title =
    (summary && typeof summary.title === "string" && summary.title.trim()) || null
  if (title) return title
  return `${session.mode} • ${session.status}`
}

export function EditSessionDialog({
  session,
  open,
  onOpenChange,
  onSave,
}: EditSessionDialogProps) {
  const axiosAuth = useAxiosAuth()
  const queryClient = useQueryClient()
  
  const [title, setTitle] = useState(() => getSessionTitle(session))
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (payload: { title?: string; mode?: string }) => {
      const res = await updateSession(axiosAuth, session.id, payload)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Failed to update session.")
      }
      return res.payload
    },
    onSuccess: (updatedSession) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      void queryClient.invalidateQueries({ queryKey: ["sessions", "recent"] })
      void queryClient.invalidateQueries({ queryKey: ["session", session.id] })
      toast.success("Session updated")
      onSave?.(updatedSession)
      onOpenChange(false)
    },
    onError: (err) => {
      setError(err.message || "Failed to update session.")
    },
  })

  const handleSave = useCallback(() => {
    setError(null)
    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title cannot be empty.")
      return
    }
    updateMutation.mutate({ title: trimmed })
  }, [title, updateMutation])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Change the title of this preparation session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Frontend Dev Interview Prep"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
