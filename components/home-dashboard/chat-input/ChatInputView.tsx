"use client"

import { cn } from "@/lib/utils"
import ChatInput from "./ChatInput"

type ChatInputViewProps = {
  className?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
}

export default function ChatInputView({
  className,
  onSend,
  disabled = false,
}: ChatInputViewProps) {
  return (
    <footer
      className={cn(
        "w-full shrink-0 border-t border-border bg-muted/30 px-4 py-3",
        className
      )}
    >
      <ChatInput
        placeholder="Type message"
        onSend={onSend}
        disabled={disabled}
      />
    </footer>
  )
}
