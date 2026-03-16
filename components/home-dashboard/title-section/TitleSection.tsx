"use client"

import { cn } from "@/lib/utils"

type TitleSectionProps = {
  title?: string
  subtitle?: string
  className?: string
}

export default function TitleSection({
  title = "CrackInt",
  subtitle = "Your AI-powered job preparation assistant",
  className,
}: TitleSectionProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 rounded-xl px-3 py-8 text-card-foreground sm:px-4 sm:py-8",
        className
      )}
    >
      <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-center text-xs text-muted-foreground sm:text-sm md:text-base">{subtitle}</p>
      )}
    </section>
  )
}
