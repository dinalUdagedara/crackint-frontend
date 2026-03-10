"use client"

import { cn } from "@/lib/utils"
import ChatInput from "./ChatInput"
import { SessionMode } from "./ModeSelector"

type ChatInputViewProps = {
  className?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
  mode?: SessionMode
  onModeChange?: (mode: SessionMode) => void
  disableTargeted?: boolean
}

export default function ChatInputView({
  className,
  onSend,
  disabled = false,
  mode,
  onModeChange,
  disableTargeted = false,
}: ChatInputViewProps) {
  return (
    <footer
      className={cn(
        "w-full shrink-0 border-t border-border bg-muted/30 px-4 py-3",
        className
      )}
    >
      <div className="max-w-5xl mx-auto">
        <ChatInput
          placeholder="Type message"
          onSend={onSend}
          disabled={disabled}
          mode={mode}
          onModeChange={onModeChange}
          disableTargeted={disableTargeted}
        />
      </div>
    </footer>
  )
}
