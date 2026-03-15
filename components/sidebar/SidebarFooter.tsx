"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  BarChart2,
  Briefcase,
  ClipboardList,
  FileCheck,
  FileText,
  FileUp,
  LayoutDashboard,
  List,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const sidebarTriggerClass =
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"

export function SidebarFooter() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAuthenticated = !!session

  const footerItems = [
   
    { title: "CV Checker", href: "/cv-score", icon: FileCheck, type: "link" as const },
    { title: "CV Upload", href: "/cv-upload", icon: FileUp, type: "link" as const },
    { title: "My CVs", href: "/resumes", icon: FileText, type: "link" as const },
    { title: "Job Poster", href: "/job-upload", icon: ClipboardList, type: "link" as const },
    { title: "Job postings", href: "/job-postings", icon: List, type: "link" as const },
    { title: "CV vs job", href: "/match", icon: BarChart2, type: "link" as const },
    { title: "Admin", href: "/admin", icon: LayoutDashboard, type: "link" as const },
    { title: "Job Tracker", href: "#", icon: Briefcase, type: "link" as const },
  ]

  const accountLabel = isAuthenticated
    ? session?.user?.name || session?.user?.email || "Account"
    : "Sign in"

  return (
    <UISidebarFooter>
      <SidebarMenu>
        {footerItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href !== "#" && pathname === item.href
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                className={cn(
                  "pr-2",
                  isActive &&
                    "bg-sidebar-primary/20 text-foreground border-l-2 border-sidebar-primary rounded-l-md data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-foreground"
                )}
              >
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(sidebarTriggerClass)}
                  aria-label={isAuthenticated ? "Account menu" : "Sign in"}
                >
                  <User />
                  <TruncatedText
                    text={accountLabel}
                    maxChars={18}
                    className="text-xs"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuLabel>
                  {isAuthenticated
                    ? session?.user?.name || session?.user?.email || "Account"
                    : "Not signed in"}
                </DropdownMenuLabel>
                {isAuthenticated && session?.user?.email && (
                  <p className="px-2 pb-1 text-xs text-muted-foreground truncate">
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
                    <LogOut className="size-4" />
                    Log out
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
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </UISidebarFooter>
  )
}
