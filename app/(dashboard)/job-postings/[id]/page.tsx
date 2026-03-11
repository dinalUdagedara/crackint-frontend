import { JobPostingDetail } from "@/components/job-postings/JobPostingDetail"

export default function JobPostingDetailPage() {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <JobPostingDetail />
      </div>
    </main>
  )
}
