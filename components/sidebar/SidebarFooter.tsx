"use client"

import Link from "next/link"
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

const footerItems = [
  { title: "Clear conversations", href: "#", icon: Trash2 },
  { title: "CV Checker", href: "#", icon: FileCheck },
  { title: "CV Upload", href: "/cv-upload", icon: FileUp },
  { title: "Job Poster", href: "/job-upload", icon: ClipboardList },
  { title: "Admin", href: "/admin", icon: LayoutDashboard },
  { title: "My account", href: "#", icon: User },
  { title: "Job Tracker", href: "#", icon: Briefcase },
  { title: "Log out", href: "#", icon: LogOut },
]

export function SidebarFooter() {
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
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </UISidebarFooter>
  )
}
