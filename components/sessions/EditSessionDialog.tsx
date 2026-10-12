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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { updateSession } from "@/services/sessions.service"
import type { PrepSession, PrepSessionUpdate, RoleLevel } from "@/types/api.types"

const ROLE_LEVEL_OPTIONS: { value: RoleLevel; label: string }[] = [
  { value: "INTERN", label: "Intern" },
  { value: "ASE", label: "Associate / mid-level" },
  { value: "SSE", label: "Senior" },
]

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
  
  const [initialTitle] = useState(() => getSessionTitle(session))
  const [title, setTitle] = useState(initialTitle)
  const [roleLevel, setRoleLevel] = useState<RoleLevel | undefined>(
    session.role_level ?? undefined
  )
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (payload: PrepSessionUpdate) => {
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
    // Only send what changed: re-sending the displayed fallback title ("MODE • STATUS")
    // would overwrite a title generated on the server since this page loaded.
    const payload: PrepSessionUpdate = {}
    if (trimmed !== initialTitle) {
      payload.title = trimmed
    }
    if (roleLevel && roleLevel !== session.role_level) {
      payload.role_level = roleLevel
    }
    if (Object.keys(payload).length === 0) {
      onOpenChange(false)
      return
    }
    updateMutation.mutate(payload)
  }, [title, initialTitle, roleLevel, session.role_level, updateMutation, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Change the title or the interview level of this session.
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

          <div className="grid gap-2">
            <Label htmlFor="role-level">Interview level</Label>
            <Select
              value={roleLevel}
              onValueChange={(value) => setRoleLevel(value as RoleLevel)}
            >
              <SelectTrigger id="role-level" className="w-full">
                <SelectValue placeholder="Auto (from the job posting)" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sets how deep the questions go. Difficulty also adapts to your scores.
            </p>
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
