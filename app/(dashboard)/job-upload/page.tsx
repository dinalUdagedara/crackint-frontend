import JobUploadView from "@/components/job-upload/JobUploadView"
import { ClientOnly } from "@/components/common/ClientOnly"

export default function JobUploadPage() {
  return (
    <ClientOnly fallback={<div className="min-h-[200px] animate-pulse rounded-lg bg-muted/50" />}>
      <JobUploadView />
    </ClientOnly>
  )
}
