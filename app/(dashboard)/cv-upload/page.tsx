import CVUploadView from "@/components/cv-upload/CVUploadView"
import { ClientOnly } from "@/components/common/ClientOnly"

export default function CVUploadPage() {
  return (
    <ClientOnly fallback={<div className="min-h-[200px] animate-pulse rounded-lg bg-muted/50" />}>
      <CVUploadView />
    </ClientOnly>
  )
}
