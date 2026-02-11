"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CVPasteAreaProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  id?: string
  className?: string
}

export default function CVPasteArea({
  value = "",
  onChange,
  placeholder = "Paste your CV text here...\n\nIf PDF parsing fails or you prefer to copy-paste, paste the content from your CV below.",
  label = "Or paste your CV text",
  id = "cv-paste",
  className,
}: CVPasteAreaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="min-h-[200px] font-mono text-sm"
      />
    </div>
  )
}
