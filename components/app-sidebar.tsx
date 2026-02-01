import * as React from "react"
import Link from "next/link"
import { MessageCircle, Plus } from "lucide-react"
import { SidebarFooter } from "@/components/sidebar/SidebarFooter"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const recentChats = [
  { title: "SE position in IFS", href: "#" },
  { title: "SE remote position in WSo2", href: "#" },
  { title: "DevOps in SyscoLabs", href: "#" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              <Link href="#">
                <Plus className="size-4" />
                <span>New chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-3">
          {recentChats.map((chat) => (
            <SidebarMenuItem key={chat.title}>
              <SidebarMenuButton asChild tooltip={chat.title}>
                <Link href={chat.href}>
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
