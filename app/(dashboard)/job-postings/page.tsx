import { Briefcase } from "lucide-react"
import { JobPostingsList } from "@/components/job-postings/JobPostingsList"

export default function JobPostingsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/40 via-muted/20 to-transparent p-6 shadow-sm md:p-8">
            <div className="relative flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Job postings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and manage your saved job postings.
                </p>
              </div>
            </div>
          </div>

          <JobPostingsList />
        </div>
      </div>
    </div>
  )
}
