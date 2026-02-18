 "use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type TruncatedTextProps = {
  text: string
  /**
   * Maximum number of characters to show before truncating.
   * Defaults to 30.
   */
  maxChars?: number
  className?: string
}

export function TruncatedText({
  text,
  maxChars = 30,
  className,
}: TruncatedTextProps) {
  const shouldTruncate = text.length > maxChars
  const displayText = shouldTruncate
    ? `${text.slice(0, maxChars).trimEnd()}…`
    : text

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-block max-w-full truncate align-middle",
            className
          )}
          title={text}
        >
          {displayText}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

