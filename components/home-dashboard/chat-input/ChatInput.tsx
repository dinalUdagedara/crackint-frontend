"use client"

import { useState, useRef } from "react"
import { Plus, Send, Target, ChevronDown } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { ClientOnly } from "@/components/common/ClientOnly"
import { cn } from "@/lib/utils"
import { ModeSelector, SessionMode } from "./ModeSelector"
import { RealtimeMic } from "./RealtimeMic"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type DifficultyLevel = "easy" | "medium" | "hard"

type ChatInputProps = {
  className?: string
  placeholder?: string
  onSend?: (message: string, files?: File[]) => void
  disabled?: boolean
  mode?: SessionMode
  onModeChange?: (mode: SessionMode) => void
  disableTargeted?: boolean
  /** Selected difficulty for the next question; null = auto (session curve). */
  difficulty?: DifficultyLevel | null
  /** Change handler for difficulty. */
  onDifficultyChange?: (value: DifficultyLevel | null) => void
}

export default function ChatInput({
  className,
  placeholder = "Type message",
  onSend,
  disabled = false,
  mode,
  onModeChange,
  disableTargeted = false,
  difficulty = null,
  onDifficultyChange,
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
        "flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-input bg-muted/50 px-2 py-2 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] sm:flex-row sm:items-end sm:gap-1 sm:py-2",
        className
      )}
    >
      <div className="order-1 flex min-w-0 flex-1 flex-col gap-2 sm:order-2 sm:flex-row sm:items-end sm:gap-1 sm:flex-nowrap">
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          minRows={1}
          maxRows={8}
          className="min-w-18 flex-1 resize-none bg-transparent py-1.5 px-1 text-base shadow-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis"
          aria-label="Message"
        />
        <div className="hidden shrink-0 items-center gap-1 sm:mb-0.5 sm:flex">
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
            className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
      <ClientOnly
        fallback={
          <>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mb-0.5"
              )}
              aria-hidden
            >
              <Plus className="size-4" />
            </span>
          </>
        }
      >
        <div className="order-2 flex shrink-0 flex-wrap items-center gap-1 sm:order-1 sm:mb-0.5 sm:flex-nowrap">
          {mode && onModeChange && (
            <ModeSelector
              mode={mode}
              onModeChange={onModeChange}
              disabled={disabled}
              disableTargeted={disableTargeted}
            />
          )}
          {onDifficultyChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-[11px] rounded-full text-muted-foreground hover:bg-muted",
                    difficulty === "easy" &&
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    difficulty === "medium" &&
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    difficulty === "hard" &&
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                  disabled={disabled}
                >
                  <Target className="mr-1 h-3.5 w-3.5" />
                  <span className="capitalize">
                    {difficulty ?? "auto"}
                  </span>
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[160px] text-[12px]">
                <DropdownMenuItem
                  onClick={() => onDifficultyChange(null)}
                  className={difficulty === null ? "bg-muted" : ""}
                >
                  Auto difficulty
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDifficultyChange("easy")}
                  className={difficulty === "easy" ? "bg-muted" : ""}
                >
                  Easy
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDifficultyChange("medium")}
                  className={difficulty === "medium" ? "bg-muted" : ""}
                >
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDifficultyChange("hard")}
                  className={difficulty === "hard" ? "bg-muted" : ""}
                >
                  Hard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="flex items-center gap-1 sm:hidden ml-auto">
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
              className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </ClientOnly>
    </form>
  )
}
