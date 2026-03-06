"use client"

import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  Briefcase,
  ClipboardList,
  FileCheck,
  FileUp,
  LayoutDashboard,
  LogOut,
  Trash2,
  User,
} from "lucide-react"
import {
  SidebarFooter as UISidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TruncatedText } from "@/components/ui/truncated-text"

export function SidebarFooter() {
  const { data: session, status } = useSession()
  const isAuthenticated = !!session

  const footerItems = [
    { title: "Clear conversations", href: "#", icon: Trash2, type: "link" as const },
    { title: "CV Checker", href: "#", icon: FileCheck, type: "link" as const },
    { title: "CV Upload", href: "/cv-upload", icon: FileUp, type: "link" as const },
    { title: "Job Poster", href: "/job-upload", icon: ClipboardList, type: "link" as const },
    { title: "Admin", href: "/admin", icon: LayoutDashboard, type: "link" as const },
    { title: "Job Tracker", href: "#", icon: Briefcase, type: "link" as const },
    // Auth-related items are handled separately below
  ]

  return (
    <UISidebarFooter>
      <SidebarMenu>
        {footerItems.map((item) => {
          const Icon = item.icon
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.href}>
                  <Icon />
                  <TruncatedText
                    text={item.title}
                    maxChars={18}
                    className="text-xs"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
        {status !== "loading" && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isAuthenticated ? "Log out" : "Sign in"}
              onClick={() => {
                if (isAuthenticated) {
                  signOut({ callbackUrl: "/", redirect: true })
                } else {
                  // Let NextAuth show the provider list; you can pass "google" to go straight to Google.
                  signIn()
                }
              }}
            >
              {isAuthenticated ? <LogOut /> : <User />}
              <TruncatedText
                text={
                  isAuthenticated
                    ? session?.user?.name || session?.user?.email || "Log out"
                    : "Sign in"
                }
                maxChars={18}
                className="text-xs"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </UISidebarFooter>
  )
}
