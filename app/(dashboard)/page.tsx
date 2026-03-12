import HomeView from "@/components/home-dashboard/HomeView"
import { HomeChatInput } from "@/components/home-dashboard/HomeChatInput"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col w-full min-w-0">
      <div className="flex-1 min-h-0 overflow-y-auto min-w-0">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:gap-4 px-3 py-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Crackint interview prep
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Upload your CV, add job postings, and run chat-style prep
                sessions with AI feedback.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="shrink-0">
                <Link href="/cv-upload">CV upload</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/resumes">My CVs</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/job-upload">Job upload</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/job-postings">Job postings</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/sessions">Prep sessions</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <HomeView />
        </div>
      </div>
      <HomeChatInput />
    </div>
  )
}
