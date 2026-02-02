"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CVPasteAreaProps = {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export default function CVPasteArea({
  value = "",
  onChange,
  placeholder = "Paste your CV text here...\n\nIf PDF parsing fails or you prefer to copy-paste, paste the content from your CV below.",
  className,
}: CVPasteAreaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="cv-paste">
        Or paste your CV text
      </Label>
      <Textarea
        id="cv-paste"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="min-h-[200px] font-mono text-sm"
      />
    </div>
  )
}
