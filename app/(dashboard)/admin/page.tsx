import { ResumeList } from "@/components/admin/ResumeList"

export default function AdminPage() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage all resumes. No auth required for now.
          </p>
        </section>
        <ResumeList />
      </div>
    </div>
  )
}
