"use client"

import { useState, useRef } from "react"
import { ImageIcon, Plus, Send } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/common/ClientOnly"
import { cn } from "@/lib/utils"
import FileUploader from "./FileUploader"
import ImageUploader from "./ImageUploader"
import { RealtimeMic } from "./RealtimeMic"

type ChatInputProps = {
  className?: string
  placeholder?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
}

export default function ChatInput({
  className,
  placeholder = "Type message",
  onSend,
  disabled = false,
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
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-0.5"
              )}
              aria-hidden
            >
              <ImageIcon className="size-4" />
            </span>
          </>
        }
      >
        <div className="mb-0.5 flex gap-1 items-center">
          <FileUploader />
          <ImageUploader />
          <RealtimeMic 
            disabled={disabled} 
            onUpdateText={(text) => {
              if (text) {
                // To support typing + speaking at same time, we could append it or just replace.
                // For simplicity let's just set it or append it if not empty.
                // But real-time STT usually replaces the partial text.
                // Since this might get tricky, let's keep it simple: 
                // We'll append the text if it's the final transcript, or replace if partial.
                // But RealtimeMic handles partials internal and passes the complete string!
                setValue((prev) => text)
              }
            }} 
          />
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
