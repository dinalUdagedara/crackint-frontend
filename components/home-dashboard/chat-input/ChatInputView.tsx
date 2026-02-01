"use client"

import { cn } from "@/lib/utils"
import ChatInput from "./ChatInput"

type ChatInputViewProps = {
  className?: string
  onSend?: (message: string, files?: File[]) => void
}

export default function ChatInputView({
  className,
  onSend,
}: ChatInputViewProps) {
  return (
    <section
      className={cn(
        "shrink-0 border-t border-border bg-muted/30 px-4 py-3",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        <ChatInput placeholder="Type message" onSend={onSend} />
      </div>
    </section>
  )
}
