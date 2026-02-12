import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import HomeView from "@/components/home-dashboard/HomeView"
import ChatInputView from "@/components/home-dashboard/chat-input/ChatInputView"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/common/ModeToggler"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>


          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col w-full">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Crackint interview prep
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Upload your CV, add job postings, and run chat-style prep
                    sessions with AI feedback.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href="/cv-upload">CV upload</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/job-upload">Job upload</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/sessions">Prep sessions</Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <HomeView />
            </div>
          </div>
          <ChatInputView />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
