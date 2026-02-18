"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
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
import { ModeToggle } from "@/components/common/ModeToggler"

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
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  )
}
