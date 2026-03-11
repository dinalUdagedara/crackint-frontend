"use client"

import { useState, useRef } from "react"
import { Plus, Send } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/common/ClientOnly"
import { cn } from "@/lib/utils"
import { ModeSelector, SessionMode } from "./ModeSelector"
import { RealtimeMic } from "./RealtimeMic"

type ChatInputProps = {
  className?: string
  placeholder?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
  mode?: SessionMode
  onModeChange?: (mode: SessionMode) => void
  disableTargeted?: boolean
}

export default function ChatInput({
  className,
  placeholder = "Type message",
  onSend,
  disabled = false,
  mode,
  onModeChange,
  disableTargeted = false,
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSend?.(trimmed)
      setValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-end gap-1 rounded-2xl border border-input bg-muted/50 px-2 py-2 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      <ClientOnly
        fallback={
          <>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-0.5"
              )}
              aria-hidden
            >
              <Plus className="size-4" />
            </span>
          </>
        }
      >
        <div className="mb-0.5 flex gap-1 items-center">
          {mode && onModeChange && (
            <ModeSelector
              mode={mode}
              onModeChange={onModeChange}
              disabled={disabled}
              disableTargeted={disableTargeted}
            />
          )}

        </div>
      </ClientOnly>
      <TextareaAutosize
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        minRows={1}
        maxRows={8}
        className="min-w-0 flex-1 resize-none bg-transparent py-1.5 px-1 shadow-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Message"
      />

      <RealtimeMic
        disabled={disabled}
        onUpdateText={(text) => {
          if (text) {
            setValue((prev) => text)
          }
        }}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={disabled || !value.trim()}
        className="mb-0.5 size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
