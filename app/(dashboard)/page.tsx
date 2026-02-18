import HomeView from "@/components/home-dashboard/HomeView"
import { HomeChatInput } from "@/components/home-dashboard/HomeChatInput"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
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
      <HomeChatInput />
    </div>
  )
}
