import type React from "react"
import type { PrepSessionWithMessages } from "@/types/api.types"
import { MessageBubble } from "./MessageBubble"

type SessionMessagesAreaProps = {
  session: PrepSessionWithMessages
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export const SessionMessagesArea: React.FC<SessionMessagesAreaProps> = ({
  session,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-20">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-4">
        {session.messages && session.messages.length > 0 ? (
          session.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-base font-medium text-foreground">
              Start your practice
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {session.mode === "TUTOR_CHAT"
                ? "Ask the coach anything about your career, resume, or interview prep."
                : 'Type a message below to get your first interview question, or say something like "Hi" to begin. Then answer each question to receive feedback and improve.'}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

