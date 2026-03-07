import { ResumeList } from "@/components/admin/ResumeList"

export default function ResumesPage() {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">My CVs</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your uploaded resumes.
          </p>
        </section>
        <ResumeList />
      </div>
    </main>
  )
}
