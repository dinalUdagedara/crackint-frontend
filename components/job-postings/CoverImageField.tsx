"use client"

import { useRef, useState } from "react"
import type { AxiosInstance } from "axios"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadCoverImage } from "@/services/uploads.service"

type CoverImageFieldProps = {
  value: string
  onChange: (url: string) => void
  idPrefix: string
  axiosAuth: AxiosInstance
}

export function CoverImageField({
  value,
  onChange,
  idPrefix,
  axiosAuth,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const previewUrl = value?.trim() || null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadCoverImage(axiosAuth, file)
      onChange(url)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Try again."
      )
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-3">
      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
          <img
            src={previewUrl}
            alt="Cover preview"
            className="h-28 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Choose image file"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Upload image
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          JPEG, PNG or WebP, max 5 MB
        </span>
      </div>

      {uploadError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {uploadError}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-cover`} className="text-muted-foreground text-xs">
          Or paste image URL
        </Label>
        <Input
          id={`${idPrefix}-cover`}
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setUploadError(null)
          }}
          placeholder="https://..."
        />
      </div>
    </div>
  )
}
