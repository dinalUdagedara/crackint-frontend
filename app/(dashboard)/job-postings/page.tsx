import { JobPostingsList } from "@/components/job-postings/JobPostingsList"

export default function JobPostingsPage() {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <JobPostingsList />
      </div>
    </main>
  )
}
