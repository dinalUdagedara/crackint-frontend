import { SessionChatView } from "@/components/sessions/SessionChatView"

export default function SessionDetailPage() {
  return (
    <main className="flex-1 overflow-auto p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <SessionChatView />
      </div>
    </main>
  )
}
