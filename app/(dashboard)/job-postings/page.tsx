import { Briefcase } from "lucide-react"
import { JobTrackerGrid } from "@/components/job-postings/JobTrackerGrid"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"

export default function JobPostingsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <HeroGradientCard>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Your jobs
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track and prepare for each role.
                </p>
              </div>
            </div>
          </HeroGradientCard>

          <JobTrackerGrid />
        </div>
      </div>
    </div>
  )
}
