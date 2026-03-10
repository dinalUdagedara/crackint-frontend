import type React from "react"
import type { Message } from "@/types/api.types"
import { Bot, Sparkles } from "lucide-react"

type MessageBubbleProps = {
  message: Message
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === "USER"
  const isFeedback = message.type === "FEEDBACK"

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <div className="mr-4 shrink-0 mt-1">
          <div
            className={`flex size-8 items-center justify-center rounded-full border shadow-sm ${
              isFeedback
                ? "bg-amber-100/50 border-amber-200/50 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-600 dark:text-amber-500"
                : "bg-background border-border text-foreground"
            }`}
          >
            {isFeedback ? <Sparkles className="size-4" /> : <Bot className="size-4" />}
          </div>
        </div>
      )}
      <div
        className={`max-w-[85%] text-[15px] ${
          isUser
            ? "bg-[#f4f4f4] dark:bg-[#2f2f2f] text-foreground rounded-[20px] px-5 py-2.5"
            : isFeedback
              ? "bg-amber-50/50 dark:bg-amber-500/5 text-foreground rounded-2xl px-5 py-4 border border-amber-200/50 dark:border-amber-500/10 shadow-sm"
              : "bg-transparent text-foreground py-1.5"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  )
}

