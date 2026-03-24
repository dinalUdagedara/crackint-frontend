"use client"

import { useState } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Loader2, Pencil, Trash2, Search, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import {
  deleteAdminUser,
  listAdminUsers,
  patchAdminUser,
} from "@/services/admin.service"
import type { AdminUserListItem, AdminUserUpdateBody } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const PAGE_SIZE = 20

export function AdminUsersPanel() {
  const axiosAuth = useAxiosAuth()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")

  const [editOpen, setEditOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editProfileImageUrl, setEditProfileImageUrl] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(
    null
  )

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { page, search: appliedSearch, pageSize: PAGE_SIZE }],
    queryFn: () =>
      listAdminUsers(axiosAuth, page, PAGE_SIZE, appliedSearch || undefined),
    placeholderData: (prev) => prev,
  })

  const patchMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string
      body: AdminUserUpdateBody
    }) => {
      const res = await patchAdminUser(axiosAuth, id, body)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Update failed.")
      }
      return res.payload
    },
    onSuccess: () => {
      toast.success("User updated.")
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      setEditOpen(false)
      setEditUser(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAdminUser(axiosAuth, id)
      if (!res.success || !res.payload) {
        throw new Error(res.message || "Delete failed.")
      }
      return res.payload
    },
    onSuccess: (payload) => {
      toast.success(
        `User deleted. Sessions: ${payload.prep_sessions_deleted}, cover letters: ${payload.cover_letters_deleted}, resumes: ${payload.resumes_deleted}, jobs: ${payload.job_postings_deleted}.`
      )
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] })
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const users = usersQuery.data?.payload ?? []
  const meta = usersQuery.data?.meta
  const errorMessage =
    usersQuery.isError && usersQuery.error instanceof Error
      ? usersQuery.error.message
      : null

  function openEdit(u: AdminUserListItem) {
    setEditUser(u)
    setEditName(u.name)
    setEditEmail(u.email)
    setEditProfileImageUrl(u.profile_image_url ?? "")
    setEditOpen(true)
  }

  function submitEdit() {
    if (!editUser) return
    const body: AdminUserUpdateBody = {}
    if (editName.trim() !== editUser.name) body.name = editName.trim()
    if (editEmail.trim() !== editUser.email) body.email = editEmail.trim()
    const nextPic = editProfileImageUrl.trim()
    const prevPic = editUser.profile_image_url ?? ""
    if (nextPic !== prevPic) {
      body.profile_image_url = nextPic === "" ? null : nextPic
    }
    if (Object.keys(body).length === 0) {
      toast.message("No changes to save.")
      return
    }
    patchMutation.mutate({ id: editUser.id, body })
  }

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>
              {meta
                ? `${meta.total_items} user(s) total`
                : "Search by email or name, paginate, edit, or delete."}
            </CardDescription>
          </div>
          <div className="flex w-full max-w-md flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search email or name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAppliedSearch(searchInput.trim())
                    setPage(1)
                  }
                }}
                className="rounded-xl"
              />
              <Button
                type="button"
                size="sm"
                className="rounded-xl shrink-0"
                onClick={() => {
                  setAppliedSearch(searchInput.trim())
                  setPage(1)
                }}
              >
                <Search className="size-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {errorMessage && (
          <div
            role="alert"
            className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {usersQuery.isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center text-sm text-muted-foreground mx-4 mb-4">
            No users match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="w-12 px-2 py-3 text-left font-medium text-muted-foreground">
                    {/* avatar */}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-2 py-2">
                      <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {u.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.profile_image_url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <Badge variant="secondary">Admin</Badge>
                      ) : (
                        <span className="text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => openEdit(u)}
                        aria-label="Edit user"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(u)}
                        disabled={u.id === currentUserId}
                        title={
                          u.id === currentUserId
                            ? "You cannot delete your own account"
                            : "Delete user"
                        }
                        aria-label="Delete user"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border/60 px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page <= 1 || usersQuery.isFetching}
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
              className="rounded-lg"
              disabled={page >= meta.total_pages || usersQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="admin-edit-name">Name</Label>
              <Input
                id="admin-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-edit-email">Email</Label>
              <Input
                id="admin-edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-edit-pic">Profile image URL</Label>
              <Input
                id="admin-edit-pic"
                type="url"
                placeholder="https://… or clear to remove"
                value={editProfileImageUrl}
                onChange={(e) => setEditProfileImageUrl(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Set empty and save to clear the picture (sends null).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={patchMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={patchMutation.isPending}>
              {patchMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the user and all related prep sessions, cover letters,
              resumes, and job postings. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
