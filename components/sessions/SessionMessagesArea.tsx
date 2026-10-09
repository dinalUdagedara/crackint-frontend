import type React from "react"
import { Loader2 } from "lucide-react"
import type { Message, PrepSessionWithMessages } from "@/types/api.types"
import { MessageBubble } from "./MessageBubble"

function draftMessage(sessionId: string, type: "FEEDBACK" | "QUESTION", content: string): Message {
  const now = new Date().toISOString()
  return {
    id: `streaming-${type}`,
    session_id: sessionId,
    sender: "ASSISTANT",
    type,
    content,
    metadata: {},
    created_at: now,
    updated_at: now,
  }
}

type SessionMessagesAreaProps = {
  session: PrepSessionWithMessages
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  pendingMessage?: Message | null
  /** Assistant text streaming in for the current turn (not stored yet). */
  draft?: { feedback: string; question: string } | null
  isStreaming?: boolean
  userAvatarUrl?: string | null
  userName?: string | null
  userEmail?: string | null
}

export const SessionMessagesArea: React.FC<SessionMessagesAreaProps> = ({
  session,
  messagesEndRef,
  pendingMessage,
  draft,
  isStreaming = false,
  userAvatarUrl,
  userName,
  userEmail,
}) => {
  const isThinking = isStreaming && !draft?.feedback && !draft?.question
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-20">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col space-y-4">
        {session.messages && session.messages.length > 0 ? (
          <>
            {session.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                userAvatarUrl={userAvatarUrl}
                userName={userName}
                userEmail={userEmail}
              />
            ))}
          </>
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
        {pendingMessage && (
          <MessageBubble
            key={pendingMessage.id}
            message={pendingMessage}
            isPending
            userAvatarUrl={userAvatarUrl}
            userName={userName}
            userEmail={userEmail}
          />
        )}
        {draft?.feedback && (
          <MessageBubble message={draftMessage(session.id, "FEEDBACK", draft.feedback)} />
        )}
        {draft?.question && (
          <MessageBubble message={draftMessage(session.id, "QUESTION", draft.question)} />
        )}
        {isThinking && (
          <div className="flex items-center gap-2 pl-12 text-sm text-muted-foreground" aria-live="polite">
            <Loader2 className="size-4 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

