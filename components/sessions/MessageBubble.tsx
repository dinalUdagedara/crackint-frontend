import React, { useMemo, useState } from "react"
import type { Message } from "@/types/api.types"
import { Bot, Clipboard, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type MessageBubbleProps = {
  message: Message
  isPending?: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isPending = false,
}) => {
  const isUser = message.sender === "USER"
  const isFeedback = message.type === "FEEDBACK"
  const isCoverLetter = message.type === "COVER_LETTER"
  const isQuestion = message.type === "QUESTION"
  const meta = message.metadata ?? message.meta ?? {}
  const difficulty = meta.difficulty
  const questionType = meta.question_type

  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore copy failures
    }
  }

  const coverLetterHref = useMemo(() => {
    if (!isCoverLetter) return null
    const sessionId = message.session_id
    // Backend currently does not send resume_id/job_posting_id in metadata
    // for COVER_LETTER messages, so we at least deeplink by session_id.
    if (!sessionId) return null
    const search = new URLSearchParams({
      session_id: sessionId,
    })
    return `/cover-letter?${search.toString()}`
  }, [isCoverLetter, message.session_id])

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <div className="mr-4 shrink-0 mt-1">
          <div
            className={`flex size-8 items-center justify-center rounded-full border shadow-sm ${isFeedback
              ? "bg-amber-100/50 border-amber-200/50 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-600 dark:text-amber-500"
              : isCoverLetter
                ? "bg-background border-primary/40 text-primary"
                : "bg-background border-border text-foreground"
              }`}
          >
            {isFeedback ? (
              <Sparkles className="size-4" />
            ) : (
              <Bot className="size-4" />
            )}
          </div>
        </div>
      )}
      <div
        className={`max-w-[85%] text-[15px] ${isUser
            ? `bg-[#f4f4f4] dark:bg-[#2f2f2f] text-foreground rounded-[20px] px-5 py-2.5 ${isPending ? "opacity-80 animate-pulse" : ""
            }`
            : isFeedback
              ? "bg-amber-50/50 dark:bg-amber-500/5 text-foreground rounded-2xl px-5 py-4 border border-amber-200/50 dark:border-amber-500/10 shadow-sm"
              : isCoverLetter
                ? "bg-background text-foreground rounded-2xl px-5 py-4 border border-primary/30 shadow-sm"
                : "bg-transparent text-foreground py-1.5"
          }`}
      >
        {isQuestion && (difficulty || questionType) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {difficulty && (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 font-medium capitalize ${
                  difficulty === "easy"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : difficulty === "medium"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {difficulty}
              </span>
            )}
            {questionType && (
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 font-medium capitalize">
                {questionType.replace(/_/g, " ")}
              </span>
            )}
          </div>
        )}
        {isCoverLetter && (
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 font-medium uppercase tracking-wide text-primary">
              <Bot className="h-3 w-3" />
              Cover letter
            </span>
            <div className="flex items-center gap-1.5">
              {coverLetterHref && (
                <Link
                  href={coverLetterHref}
                  className="rounded-full px-2 py-0.5 text-[11px] text-primary underline-offset-2 hover:underline"
                >
                  Open editor
                </Link>
              )}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        <div
          className={`whitespace-pre-wrap leading-relaxed ${isCoverLetter ? "text-sm font-normal leading-7 md:text-[15px]" : ""
            }`}
        >
          {message.content}
        </div>
        {isPending && (
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            Sending…
          </div>
        )}
      </div>
    </div>
  )
}

