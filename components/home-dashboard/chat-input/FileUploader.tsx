"use client"

import { useId } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FileUploaderProps = {
  className?: string
  onFileSelect?: (files: FileList | null) => void
}

export default function FileUploader({
  className,
  onFileSelect,
}: FileUploaderProps) {
  const id = useId()
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
        onClick={() => document.getElementById(id)?.click()}
        aria-label="Attach file"
      >
        <Plus className="size-4" />
      </Button>
      <input
        id={id}
        type="file"
        className="sr-only"
        multiple
        onChange={(e) => onFileSelect?.(e.target.files)}
      />
    </>
  )
}
