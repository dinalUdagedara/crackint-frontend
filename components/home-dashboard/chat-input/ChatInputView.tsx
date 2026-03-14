"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import ChatInput from "./ChatInput"
import { SessionMode } from "./ModeSelector"

export type ChatInputViewProps = {
  className?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
  mode?: SessionMode
  onModeChange?: (mode: SessionMode) => void
  disableTargeted?: boolean
  /** Optional actions row rendered beside the input (not used for advanced question anymore). */
  actions?: React.ReactNode
  /** Selected difficulty for the next question; null = auto (session curve). */
  difficulty?: "easy" | "medium" | "hard" | null
  /** Change handler for difficulty. */
  onDifficultyChange?: (value: "easy" | "medium" | "hard" | null) => void
}

export default function ChatInputView({
  className,
  onSend,
  disabled = false,
  mode,
  onModeChange,
  disableTargeted = false,
  actions,
  difficulty = null,
  onDifficultyChange,
}: ChatInputViewProps) {
  return (
    <footer
      className={cn(
        "w-full shrink-0 border-t border-border bg-muted/30 px-3 py-2 sm:px-4 sm:py-3",
        className
      )}
    >
      <div className={cn("max-w-5xl mx-auto min-w-0", actions && "flex items-center gap-2")}>
        {actions}
        <div className={actions ? "min-w-0 flex-1" : undefined}>
          <ChatInput
            placeholder="Type message"
            onSend={onSend}
            disabled={disabled}
            mode={mode}
            onModeChange={onModeChange}
            disableTargeted={disableTargeted}
            difficulty={difficulty}
            onDifficultyChange={onDifficultyChange}
          />
        </div>
      </div>
    </footer>
  )
}
