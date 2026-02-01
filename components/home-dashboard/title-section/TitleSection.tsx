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
        "rounded-xl px-4 text-card-foreground flex flex-col gap-2 items-center sm:py-32 py-16",
        className
      )}
    >
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7D0D0]">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">{subtitle}</p>
      )}
    </section>
  )
}
