import { FileText } from "lucide-react"
import { ResumeList } from "@/components/admin/ResumeList"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"

export default function ResumesPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <HeroGradientCard>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  My CVs
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and manage your uploaded resumes.
                </p>
              </div>
            </div>
          </HeroGradientCard>

          <ResumeList />
        </div>
      </div>
    </div>
  )
}
