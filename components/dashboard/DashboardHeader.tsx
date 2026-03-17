"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession, signOut, signIn } from "next-auth/react"
import { User } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ClientOnly } from "@/components/common/ClientOnly"
import { ModeToggle } from "@/components/common/ModeToggler"
import { NearDeadlineNotification } from "@/components/dashboard/NearDeadlineNotification"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type BreadcrumbSegment = { label: string; href: string | null }

function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  if (pathname === "/") {
    return [{ label: "Home", href: "/" }, { label: "Dashboard", href: null }]
  }
  if (pathname === "/sessions") {
    return [
      { label: "Home", href: "/" },
      { label: "Prep Sessions", href: null },
    ]
  }
  if (pathname.startsWith("/sessions/")) {
    return [
      { label: "Home", href: "/" },
      { label: "Prep Sessions", href: "/sessions" },
      { label: "Session", href: null },
    ]
  }
  if (pathname === "/cv-upload") {
    return [
      { label: "Home", href: "/" },
      { label: "CV Upload", href: null },
    ]
  }
  if (pathname === "/job-upload") {
    return [
      { label: "Home", href: "/" },
      { label: "Job Poster Upload", href: null },
    ]
  }
  if (pathname === "/job-postings") {
    return [
      { label: "Home", href: "/" },
      { label: "Job Postings", href: null },
    ]
  }
  if (pathname.match(/^\/job-postings\/[^/]+\/edit$/)) {
    const id = pathname.split("/")[2]
    return [
      { label: "Home", href: "/" },
      { label: "Job Postings", href: "/job-postings" },
      { label: "Job", href: `/job-postings/${id}` },
      { label: "Edit", href: null },
    ]
  }
  if (pathname.startsWith("/job-postings/")) {
    return [
      { label: "Home", href: "/" },
      { label: "Job Postings", href: "/job-postings" },
      { label: "Job Posting", href: null },
    ]
  }
  if (pathname === "/admin") {
    return [
      { label: "Home", href: "/" },
      { label: "Admin", href: null },
    ]
  }
  return [{ label: "Home", href: "/" }, { label: pathname.slice(1), href: null }]
}

export function DashboardHeader() {
  const pathname = usePathname()
  const segments = getBreadcrumbs(pathname)
  const { data: session, status } = useSession()

  const isAuthenticated = !!session

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((seg, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
              <BreadcrumbItem
                className={
                  i < segments.length - 1 ? "hidden md:block" : undefined
                }
              >
                {seg.href !== null ? (
                  <BreadcrumbLink href={seg.href}>{seg.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{seg.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ClientOnly>
          <NearDeadlineNotification />
        </ClientOnly>
        <ClientOnly>
          <ModeToggle />
        </ClientOnly>
        <ClientOnly>
          {status !== "loading" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label={isAuthenticated ? "Account menu" : "Sign in"}
                >
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {isAuthenticated
                    ? session.user?.name || session.user?.email || "Account"
                    : "Not signed in"}
                </DropdownMenuLabel>
                {isAuthenticated && session.user?.email && (
                  <p className="px-2 pb-1 text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                )}
                <DropdownMenuSeparator />
                {isAuthenticated ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      void signOut({ callbackUrl: "/", redirect: true })
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        void signIn("credentials", { callbackUrl: "/" })
                      }}
                    >
                      Sign in with email
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void signIn("google", { callbackUrl: "/" })
                      }}
                    >
                      Sign in with Google
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ClientOnly>
      </div>
    </header>
  )
}
