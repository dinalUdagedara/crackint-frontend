"use client"

import { useId } from "react"
import { ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ImageUploaderProps = {
  className?: string
  onImageSelect?: (files: FileList | null) => void
}

export default function ImageUploader({
  className,
  onImageSelect,
}: ImageUploaderProps) {
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
        aria-label="Attach image"
      >
        <ImageIcon className="size-4" />
      </Button>
      <input
        id={id}
        type="file"
        className="sr-only"
        accept="image/*"
        multiple
        onChange={(e) => onImageSelect?.(e.target.files)}
      />
    </>
  )
}
