"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Loader2, AlertCircle, Filter } from "lucide-react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listAdminSessions } from "@/services/admin.service"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatReadiness(score: number | null) {
  if (score == null) return "—"
  return Math.round(score)
}

const PAGE_SIZE = 20

type StatusFilter = "all" | "ACTIVE" | "COMPLETED"

export function AdminSessionsPanel() {
  const axiosAuth = useAxiosAuth()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE")
  const [userIdInput, setUserIdInput] = useState("")
  const [appliedUserId, setAppliedUserId] = useState("")

  const sessionsQuery = useQuery({
    queryKey: [
      "admin",
      "sessions",
      {
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        userId: appliedUserId,
      },
    ],
    queryFn: () =>
      listAdminSessions(axiosAuth, {
        page,
        page_size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        user_id: appliedUserId.trim() || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const sessions = sessionsQuery.data?.payload ?? []
  const meta = sessionsQuery.data?.meta
  const errorMessage =
    sessionsQuery.isError && sessionsQuery.error instanceof Error
      ? sessionsQuery.error.message
      : null

  function applyFilters() {
    setAppliedUserId(userIdInput.trim())
    setPage(1)
  }

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-base">Prep sessions</CardTitle>
            <CardDescription>
              {meta
                ? `${meta.total_items} session(s) total`
                : "All users’ sessions; filter by status or owner."}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as StatusFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 flex-1 gap-2 sm:max-w-xs">
              <Label htmlFor="admin-session-user" className="text-xs text-muted-foreground">
                User ID (UUID)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="admin-session-user"
                  placeholder="Optional filter…"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters()
                  }}
                  className="rounded-xl font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={applyFilters}
                >
                  <Filter className="size-4" />
                  Apply
                </Button>
              </div>
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

        {sessionsQuery.isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-6 py-12 text-center text-sm text-muted-foreground mx-4 mb-4">
            No sessions match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Readiness
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-mono text-xs font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {s.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.user_email ?? "—"}
                      {s.user_name && (
                        <span className="block text-xs">{s.user_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.mode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.status}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatReadiness(s.readiness_score)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(s.created_at)}
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
              disabled={page <= 1 || sessionsQuery.isFetching}
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
              disabled={page >= meta.total_pages || sessionsQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
