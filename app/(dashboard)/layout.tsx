import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { ParticlesBackground } from "@/components/ui/particles-background"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ParticlesBackground />
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <DashboardHeader />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
