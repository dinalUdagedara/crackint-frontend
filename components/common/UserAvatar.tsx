"use client"

import { User } from "lucide-react"
import { cn } from "@/lib/utils"

export type UserAvatarSize = "xs" | "sm" | "md" | "lg"

const sizeMap: Record<
  UserAvatarSize,
  { box: string; icon: string; text: string }
> = {
  xs: { box: "size-6", icon: "size-3", text: "text-[10px]" },
  sm: { box: "size-8", icon: "size-4", text: "text-xs" },
  md: { box: "size-9", icon: "size-4", text: "text-sm" },
  lg: { box: "size-12", icon: "size-6", text: "text-base" },
}

function initialsFrom(
  name: string | null | undefined,
  email: string | null | undefined
): string | null {
  const n = name?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (
        parts[0]![0]! + parts[parts.length - 1]![0]!
      ).toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }
  const e = email?.trim()
  if (e) return e.slice(0, 2).toUpperCase()
  return null
}

export type UserAvatarProps = {
  imageUrl?: string | null
  name?: string | null
  email?: string | null
  size?: UserAvatarSize
  className?: string
}

/**
 * Profile photo when `imageUrl` is set; otherwise initials or a generic user icon.
 */
export function UserAvatar({
  imageUrl,
  name,
  email,
  size = "sm",
  className,
}: UserAvatarProps) {
  const s = sizeMap[size]
  const initials = initialsFrom(name, email)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground ring-1 ring-border/60",
        s.box,
        s.text,
        className
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- S3 / external profile URLs
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : initials ? (
        <span className="select-none">{initials}</span>
      ) : (
        <User className={cn(s.icon, "text-muted-foreground")} aria-hidden />
      )}
    </span>
  )
}
