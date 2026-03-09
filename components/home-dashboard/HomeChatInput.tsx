"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { createSession, postChatTurn } from "@/services/sessions.service"
import ChatInputView from "./chat-input/ChatInputView"
import { SessionMode } from "./chat-input/ModeSelector"

export function HomeChatInput() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const axiosAuth = useAxiosAuth()
  const [mode, setMode] = useState<SessionMode>("TUTOR_CHAT")

  const startTutorChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const trimmed = message.trim()
      if (!trimmed) {
        throw new Error("Please enter a message.")
      }

      const createRes = await createSession(axiosAuth, {
        user_id: null,
        resume_id: null,
        job_posting_id: null,
        mode: mode,
      })

      if (!createRes.success || !createRes.payload?.id) {
        throw new Error("Failed to start session.")
      }

      const sessionId = createRes.payload.id

      await postChatTurn(axiosAuth, sessionId, trimmed)

      return { sessionId }
    },
    onSuccess: ({ sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] })
      void queryClient.invalidateQueries({ queryKey: ["sessions", "recent"] })
      toast.success("Session started")
      router.push(`/sessions/${sessionId}`)
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start session. Try again.")
    },
  })

  async function handleSend(message: string) {
    if (startTutorChatMutation.isPending) return
    startTutorChatMutation.mutate(message)
  }

  return (
    <div className="w-full">

      <ChatInputView
        onSend={handleSend}
        disabled={startTutorChatMutation.isPending}
        mode={mode}
        onModeChange={setMode}
        disableTargeted={true} // In home screen, we don't have resume/job selected yet
      />

    </div>
  )
}
