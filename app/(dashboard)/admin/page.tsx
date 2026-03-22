import { LayoutDashboard } from "lucide-react"
import { ResumeList } from "@/components/admin/ResumeList"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"

export default function AdminPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <HeroGradientCard>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutDashboard className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                  Admin dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and manage all resumes. No auth required for now.
                </p>
              </div>
            </div>
          </HeroGradientCard>

          <ResumeList title="All resumes" description="View and manage all CVs in the system." />
        </div>
      </div>
    </div>
  )
}
