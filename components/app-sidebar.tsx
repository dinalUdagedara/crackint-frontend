"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageCircle, Plus, Trash2 } from "lucide-react"
import { SidebarFooter } from "@/components/sidebar/SidebarFooter"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { deleteSession, listSessions } from "@/services/sessions.service"
import type { PrepSession } from "@/types/api.types"

function formatSessionLabel(session: PrepSession): string {
  const modeLabel =
    session.mode === "QUICK_PRACTICE" ? "Quick practice" : "Targeted"
  return `${modeLabel} • ${session.status}`
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [deleteTarget, setDeleteTarget] = React.useState<PrepSession | null>(
    null
  )

  const recentSessionsQuery = useQuery({
    queryKey: ["sessions", "recent"],
    queryFn: async (): Promise<PrepSession[]> => {
      const res = await listSessions(1, 10)
      return res.payload ?? []
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteSession(id)
      if (!res.success) {
        throw new Error(res.message ?? "Failed to delete session.")
      }
      return res
    },
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      setDeleteTarget(null)
      toast.success("Session deleted")
      if (pathname === `/sessions/${id}`) {
        router.push("/sessions")
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete session.")
    },
  })

  function openDeleteDialog(session: PrepSession, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(session)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleteSessionMutation.isPending) return
    try {
      await deleteSessionMutation.mutateAsync(deleteTarget.id)
    } catch {
      // error shown via mutation
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className={cn(
                "bg-[#ADADFB]/80 text-white hover:bg-[#ADADFB] hover:text-white rounded-lg",
                "data-[active=true]:bg-[#ADADFB] data-[active=true]:text-white"
              )}
            >
              <Link href="/sessions">
                <Plus className="size-4" />
                <span>New chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 overflow-hidden *:data-[slot=scroll-area-viewport]:min-h-0">
          <SidebarMenu className="px-3 py-2">
            {recentSessionsQuery.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <Skeleton className="h-9 w-full rounded-md" />
                </SidebarMenuItem>
              ))
            ) : recentSessionsQuery.isError ? (
              <SidebarMenuItem>
                <span className="px-2 text-xs text-muted-foreground">
                  Couldn&apos;t load sessions
                </span>
              </SidebarMenuItem>
            ) : (
              (recentSessionsQuery.data ?? []).map((session) => {
                const href = `/sessions/${session.id}`
                const label = formatSessionLabel(session)
                const isActive = pathname === href
                return (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      isActive={isActive}
                      className="pr-8"
                    >
                      <Link href={href}>
                        <MessageCircle className="size-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      onClick={(e) => openDeleteDialog(session, e)}
                      disabled={deleteSessionMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete session"
                    >
                      {deleteSessionMutation.isPending &&
                      deleteTarget?.id === session.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                )
              })
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            deleteSessionMutation.reset()
          }
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the session and all its messages.
          </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSessionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDelete()
              }}
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}
