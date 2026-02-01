"use client"

import { useCallback, useId, useState } from "react"
import { FileUp, FileText, Image } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = ".pdf,image/*"
const MAX_FILE_SIZE_MB = 5

type CVFileDropZoneProps = {
  onFileSelect?: (file: File | null) => void
  className?: string
}

export default function CVFileDropZone({
  onFileSelect,
  className,
}: CVFileDropZoneProps) {
  const id = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const isPDF = file.type === "application/pdf"
    const isImage = file.type.startsWith("image/")
    if (!isPDF && !isImage) {
      return "Please upload a PDF or image file."
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB.`
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File | null) => {
      setSelectedFile(file)
      setError(null)
      if (file) {
        const err = validateFile(file)
        if (err) {
          setError(err)
          onFileSelect?.(null)
        } else {
          onFileSelect?.(file)
        }
      } else {
        onFileSelect?.(null)
      }
    },
    [onFileSelect, validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      handleFile(file)
      e.target.value = ""
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    handleFile(null)
  }, [handleFile])

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-input hover:border-primary/50 hover:bg-muted/50",
          error && "border-destructive"
        )}
      >
        <div className="flex gap-2 text-muted-foreground">
          <FileText className="size-8" />
          <Image className="size-8" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop your CV here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF or images up to {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
        <input
          id={id}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      {selectedFile && !error && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <FileUp className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
