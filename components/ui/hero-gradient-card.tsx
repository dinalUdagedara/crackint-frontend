import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function HeroGradientCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-background p-6 shadow-sm md:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-muted/40 via-muted/20 to-transparent"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )
}
