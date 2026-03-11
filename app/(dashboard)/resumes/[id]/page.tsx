import { ResumeDetail } from "@/components/resumes/ResumeDetail"

export default function ResumeDetailPage() {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <ResumeDetail />
      </div>
    </main>
  )
}
