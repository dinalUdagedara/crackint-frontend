"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, MessageSquare, Target } from "lucide-react"

export type SessionMode = "TARGETED" | "QUICK_PRACTICE" | "TUTOR_CHAT"

interface ModeSelectorProps {
  mode: SessionMode
  onModeChange: (mode: SessionMode) => void
  disabled?: boolean
  // We can pass a flag to disable TARGETED if no resume/job is selected
  disableTargeted?: boolean
}

export function ModeSelector({ mode, onModeChange, disabled, disableTargeted }: ModeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80"
          disabled={disabled}
        >
          {mode === "TUTOR_CHAT" ? (
            <MessageSquare className="mr-1.5 h-4 w-4" />
          ) : (
            <Target className="mr-1.5 h-4 w-4" />
          )}
          <span className="font-medium">
            {mode === "TUTOR_CHAT" ? "Tutor" : mode === "QUICK_PRACTICE" ? "Practice" : "Targeted"}
          </span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[180px]">
        <DropdownMenuItem
          onClick={() => onModeChange("TUTOR_CHAT")}
          className={mode === "TUTOR_CHAT" ? "bg-muted" : ""}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Tutor Chat
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onModeChange("QUICK_PRACTICE")}
          className={mode === "QUICK_PRACTICE" ? "bg-muted" : ""}
        >
          <Target className="mr-2 h-4 w-4" />
          Quick Practice
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onModeChange("TARGETED")}
          disabled={disableTargeted}
          className={mode === "TARGETED" ? "bg-muted" : ""}
          title={disableTargeted ? "Requires Resume and Job Posting to be set in session settings" : undefined}
        >
          <Target className="mr-2 h-4 w-4" />
          Targeted Interview
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
