"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

const difficultyConfig = {
  easy: {
    label: "Easy",
    color: "hsl(var(--chart-1))",
  },
  medium: {
    label: "Medium",
    color: "hsl(var(--chart-2))",
  },
  hard: {
    label: "Hard",
    color: "hsl(var(--chart-3))",
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
    { key: "easy", label: "Easy", value: easy },
    { key: "medium", label: "Medium", value: medium },
    { key: "hard", label: "Hard", value: hard },
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
    <ChartContainer config={difficultyConfig} className="h-40 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted) / 0.6)" }}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="value" radius={4} barSize={32}>
          {data.map((entry) => (
            <Cell
              key={entry.key}
              fill={`var(--color-${entry.key})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
