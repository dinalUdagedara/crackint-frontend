"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createSession,
  appendMessage,
} from "@/services/sessions.service"
import ChatInputView from "./chat-input/ChatInputView"

export function HomeChatInput() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const startQuickPracticeMutation = useMutation({
    mutationFn: async (message: string) => {
      const trimmed = message.trim()
      if (!trimmed) {
        throw new Error("Please enter a message.")
      }

      const createRes = await createSession({
        user_id: null,
        resume_id: null,
        job_posting_id: null,
        mode: "QUICK_PRACTICE",
      })

      if (!createRes.success || !createRes.payload?.id) {
        throw new Error("Failed to start session.")
      }

      const sessionId = createRes.payload.id

      await appendMessage(sessionId, {
        sender: "USER",
        type: "QUESTION",
        content: trimmed,
        metadata: {},
      })

      return { sessionId }
    },
    onSuccess: ({ sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast.success("Session started")
      router.push(`/sessions/${sessionId}`)
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start session. Try again.")
    },
  })

  async function handleSend(message: string) {
    if (startQuickPracticeMutation.isPending) return
    startQuickPracticeMutation.mutate(message)
  }

  return (
    <div className="w-full">
      <ChatInputView
        onSend={handleSend}
        disabled={startQuickPracticeMutation.isPending}
      />
    </div>
  )
}
