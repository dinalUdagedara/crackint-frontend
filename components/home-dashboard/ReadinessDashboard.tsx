"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import type { ReadinessSummaryResponse, ReadinessTrendItem } from "@/types/api.types"
import { getReadinessSummary, getReadinessTrend } from "@/services/readiness.service"
import Link from "next/link"
import { BarChart3, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReadinessSkeletonCard } from "./readiness-dashboard/ReadinessSkeletonCard"
import { ReadinessTrendBadge } from "./readiness-dashboard/ReadinessTrendBadge"
import { ReadinessMiniStat } from "./readiness-dashboard/ReadinessMiniStat"
import { ReadinessDifficultyChart } from "./readiness-dashboard/ReadinessDifficultyChart"
import { ReadinessTrendChart } from "./readiness-dashboard/ReadinessTrendChart"
import { ReadinessEmptyState } from "./readiness-dashboard/ReadinessEmptyState"

type DashboardState = "idle" | "loading" | "success" | "error"

export default function ReadinessDashboard() {
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()
  const [state, setState] = useState<DashboardState>("idle")
  const [summary, setSummary] = useState<ReadinessSummaryResponse | null>(null)
  const [trend, setTrend] = useState<ReadinessTrendItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return

    let cancelled = false
    async function load() {
      setState("loading")
      setError(null)
      try {
        const [summaryRes, trendRes] = await Promise.all([
          getReadinessSummary(axiosAuth, { last_n_sessions: 10 }),
          getReadinessTrend(axiosAuth, { limit: 10 }),
        ])
        if (cancelled) return
        setSummary(summaryRes.payload ?? null)
        setTrend(trendRes.payload ?? null)
        setState("success")
      } catch (e) {
        if (cancelled) return
        const message =
          e instanceof Error ? e.message : "Failed to load readiness data"
        setError(message)
        setState("error")
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [axiosAuth, status])

  const hasData = useMemo(
    () => Boolean(summary && trend && trend.length > 0),
    [summary, trend]
  )

  const difficulty = summary?.difficulty_distribution

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Readiness dashboard
          </h2>
          <p className="text-xs text-muted-foreground">
            Overall interview readiness based on your CV, practice sessions, and
            feedback trends.
          </p>
        </div>
        {state === "error" && (
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        )}
      </div>

      {state === "loading" && (
        <div className="grid gap-4 md:grid-cols-3">
          <ReadinessSkeletonCard />
          <ReadinessSkeletonCard />
          <ReadinessSkeletonCard />
        </div>
      )}

      {state === "error" && (
        <Card className="p-4">
          <p className="text-sm text-destructive">
            {error ?? "Something went wrong while loading readiness data."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can try again or continue using other features while we fix
            this.
          </p>
        </Card>
      )}

      {state === "success" && summary && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Combined readiness
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">
                      {Math.round(summary.combined_score)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / 100
                    </span>
                  </div>
                </div>
                <ReadinessTrendBadge trend={summary.trend} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                {summary.cv_score !== null && (
                  <ReadinessMiniStat
                    label="CV score"
                    value={`${Math.round(summary.cv_score)} / 100`}
                  />
                )}
                {summary.session_avg !== null && (
                  <ReadinessMiniStat
                    label="Session average"
                    value={`${Math.round(summary.session_avg)} / 100`}
                  />
                )}
                {summary.gap_severity && (
                  <ReadinessMiniStat
                    label="Gap severity"
                    value={summary.gap_severity}
                    tone={summary.gap_severity}
                  />
                )}
              </div>
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Practice stats
              </p>
              <div className="flex items-baseline gap-3">
                <div>
                  <div className="text-xl font-semibold">
                    {summary.session_count_with_scores}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    sessions with feedback
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-xl font-semibold">
                    {summary.session_count_total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    total sessions
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Aggregated over approximately the last{" "}
                <span className="font-medium">
                  {summary.last_n_sessions}
                </span>{" "}
                scored sessions.
              </p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Difficulty distribution
              </p>
              {difficulty && (difficulty.easy || difficulty.medium || difficulty.hard) ? (
                <ReadinessDifficultyChart
                  easy={difficulty.easy}
                  medium={difficulty.medium}
                  hard={difficulty.hard}
                />
              ) : (
                <ReadinessEmptyState
                  icon={BarChart3}
                  title="No difficulty breakdown yet"
                  description={
                    summary.session_count_with_scores > 0
                      ? "Your scored sessions don't include difficulty tags yet. New practice with feedback will show easy / medium / hard here."
                      : "Answer questions and get feedback in practice sessions to see your easy / medium / hard breakdown here."
                  }
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href="/sessions">Prep sessions</Link>
                    </Button>
                  }
                />
              )}
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Readiness over time
              </p>
              {trend && trend.length > 0 ? (
                <ReadinessTrendChart items={trend} />
              ) : (
                <ReadinessEmptyState
                  icon={TrendingUp}
                  title={
                    summary.session_count_with_scores >= 2
                      ? "Trend will appear here"
                      : "No trend yet"
                  }
                  description={
                    summary.session_count_with_scores >= 2
                      ? `You have ${summary.session_count_with_scores} scored sessions. The chart will show once trend data is available.`
                      : "Complete practice sessions and get scored feedback to see your readiness over time."
                  }
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href="/sessions">Start a session</Link>
                    </Button>
                  }
                />
              )}
            </Card>
          </div>
        </div>
      )}

      {state === "success" && !hasData && (
        <Card className="p-4">
          <p className="text-sm font-medium">
            Not enough data yet to build your readiness dashboard.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run a few practice sessions and provide feedback to unlock
            personalized readiness insights here.
          </p>
        </Card>
      )}
    </section>
  )
}
