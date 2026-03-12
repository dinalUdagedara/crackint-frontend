"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

const difficultyConfig = {
  value: {
    label: "Sessions",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export interface ReadinessDifficultyChartProps {
  easy: number
  medium: number
  hard: number
}

export function ReadinessDifficultyChart({
  easy,
  medium,
  hard,
}: ReadinessDifficultyChartProps) {
  const data = [
    { label: "Easy", value: easy },
    { label: "Medium", value: medium },
    { label: "Hard", value: hard },
  ]

  const total = easy + medium + hard
  if (!total) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No feedback counted yet.
      </p>
    )
  }

  return (
    <ChartContainer
      config={difficultyConfig}
      className="mx-auto aspect-square max-h-[220px] w-full min-w-0"
    >
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="label" />
        <PolarGrid />
        <Radar
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}
