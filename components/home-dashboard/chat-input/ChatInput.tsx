"use client"

import { useState } from "react"
import { ImageIcon, Plus, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/common/ClientOnly"
import { cn } from "@/lib/utils"
import FileUploader from "./FileUploader"
import ImageUploader from "./ImageUploader"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSend?.(trimmed)
      setValue("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center gap-1 rounded-2xl border border-input bg-muted/50 px-2 py-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      <ClientOnly
        fallback={
          <>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-hidden
            >
              <Plus className="size-4" />
            </span>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-hidden
            >
              <ImageIcon className="size-4" />
            </span>
          </>
        }
      >
        <FileUploader />
        <ImageUploader />
      </ClientOnly>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="Message"
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
