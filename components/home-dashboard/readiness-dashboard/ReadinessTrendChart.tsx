"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import type { ReadinessTrendItem } from "@/types/api.types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { ReadinessEmptyState } from "./ReadinessEmptyState"

const MIN_POINTS_FOR_TREND = 3

const trendChartConfig = {
  score: {
    label: "Readiness score",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export interface ReadinessTrendChartProps {
  items: ReadinessTrendItem[]
}

type TimeRangeKey = "12h" | "1d" | "3d" | "7d"

export function ReadinessTrendChart({ items }: ReadinessTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("7d")

  const allPoints = useMemo(
    () =>
      items
        .filter((i) => i.readiness_score !== null)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((item) => ({
          date: item.created_at,
          dateLabel: new Date(item.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          score: item.readiness_score as number,
          title: item.title,
        })),
    [items]
  )

  const points = useMemo(() => {
    if (allPoints.length === 0) return []
    const referenceDate = new Date(
      allPoints[allPoints.length - 1]?.date ?? Date.now()
    )
    const msBack =
      timeRange === "12h"
        ? 12 * 60 * 60 * 1000
        : timeRange === "1d"
          ? 24 * 60 * 60 * 1000
          : timeRange === "3d"
            ? 3 * 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000
    const startDate = new Date(referenceDate.getTime() - msBack)
    return allPoints.filter((item) => new Date(item.date) >= startDate)
  }, [allPoints, timeRange])

  if (allPoints.length < MIN_POINTS_FOR_TREND) {
    return (
      <ReadinessEmptyState
        icon={TrendingUp}
        title={
          allPoints.length === 0
            ? "No scores yet"
            : allPoints.length === 1
              ? "Two more to see your trend"
              : "One more to see your trend"
        }
        description={
          allPoints.length === 0
            ? "Finish sessions with feedback to see your readiness trend on this chart."
            : `Complete ${MIN_POINTS_FOR_TREND - allPoints.length} more scored session${MIN_POINTS_FOR_TREND - allPoints.length === 1 ? "" : "s"} to plot your readiness over time.`
        }
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/sessions">Prep sessions</Link>
          </Button>
        }
      />
    )
  }

  const chartData = points.map((p) => ({
    date: p.date,
    score: p.score,
  }))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Select
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRangeKey)}
        >
          <SelectTrigger
            className="h-8 w-[130px] rounded-lg"
            aria-label="Time range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="12h" className="rounded-lg">
              Last 12 hrs
            </SelectItem>
            <SelectItem value="1d" className="rounded-lg">
              Last 1 day
            </SelectItem>
            <SelectItem value="3d" className="rounded-lg">
              Last 3 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ChartContainer
        config={trendChartConfig}
        className="aspect-auto h-[220px] w-full"
      >
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-score)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-score)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                className="rounded-xl border-border bg-popover px-3 py-2.5 text-xs shadow-lg"
                labelClassName="text-foreground"
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                indicator="dot"
              />
            }
          />
          <Area
            dataKey="score"
            type="natural"
            fill="url(#fillScore)"
            stroke="var(--color-score)"
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
      <p className="text-[11px] text-muted-foreground">
        Based on your most recent scored sessions.
      </p>
    </div>
  )
}
