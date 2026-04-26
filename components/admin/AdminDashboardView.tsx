"use client"

import { LayoutDashboard, Loader2, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel"
import { AdminSessionsPanel } from "@/components/admin/AdminSessionsPanel"

export function AdminDashboardView() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.isAdmin === true

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-2xl">
            <div
              role="alert"
              className="flex gap-3 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <ShieldAlert className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Admin access required</p>
                <p className="mt-1 text-destructive/90">
                  Your account is not an admin. If you need access, ask a
                  maintainer to set{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    is_admin
                  </code>{" "}
                  in the database, then sign out and sign in again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <HeroGradientCard>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutDashboard className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Admin dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage users and inspect prep sessions across the platform.
                  API:{" "}
                  <code className="rounded bg-muted/80 px-1.5 py-0.5 text-xs">
                    GET /api/v1/admin/users
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted/80 px-1.5 py-0.5 text-xs">
                    GET /api/v1/admin/sessions
                  </code>
                  .
                </p>
              </div>
            </div>
          </HeroGradientCard>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="rounded-xl">
              <TabsTrigger value="users" className="rounded-lg">
                Users
              </TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-lg">
                Sessions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-4">
              <AdminUsersPanel />
            </TabsContent>
            <TabsContent value="sessions" className="mt-4">
              <AdminSessionsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
