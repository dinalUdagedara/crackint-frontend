"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Check, Download, Loader2, RotateCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import {
  SessionsError,
  completeSession,
  createSession,
  getSession,
  getSessionReport,
} from "@/services/sessions.service"
import { getJobPosting } from "@/services/job-postings.service"
import type { SessionReportItem, StarBreakdown } from "@/types/api.types"
import { cn } from "@/lib/utils"

function scoreClass(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground"
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </Card>
  )
}

function StarChips({ star }: { star: StarBreakdown }) {
  const parts: [string, boolean][] = [
    ["Situation", star.situation],
    ["Task", star.task],
    ["Action", star.action],
    ["Result", star.result],
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {parts.map(([label, ok]) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              ok
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {ok ? <Check className="size-3" /> : <X className="size-3" />}
            {label}
          </span>
        ))}
      </div>
      {star.note && <p className="text-xs text-muted-foreground">{star.note}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function ItemDetail({ item }: { item: SessionReportItem }) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <Section title="Question">{item.question}</Section>
      <Section title="Your answer">{item.answer}</Section>
      <Section title="Feedback">{item.feedback}</Section>
      {item.star && (
        <Section title="STAR structure">
          <StarChips star={item.star} />
        </Section>
      )}
      {item.model_answer && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <Section title="Model answer">{item.model_answer}</Section>
        </div>
      )}
    </div>
  )
}

export function SessionReportView() {
  const { id: sessionId } = useParams<{ id: string }>()
  const router = useRouter()
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()
  const [isRetrying, setIsRetrying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => (await getSession(axiosAuth, sessionId)).payload,
    enabled: status === "authenticated" && !!sessionId,
  })

  const reportQuery = useQuery({
    queryKey: ["session-report", sessionId],
    queryFn: async () => {
      try {
        return (await getSessionReport(axiosAuth, sessionId)).payload
      } catch (e) {
        // Not completed yet (e.g. opened by URL): complete it now.
        if (e instanceof SessionsError && e.status === 404) {
          return (await completeSession(axiosAuth, sessionId)).payload
        }
        throw e
      }
    },
    enabled: status === "authenticated" && !!sessionId,
    retry: false,
  })

  const session = sessionQuery.data
  const jobQuery = useQuery({
    queryKey: ["jobPosting", session?.job_posting_id],
    queryFn: () => getJobPosting(axiosAuth, session!.job_posting_id!),
    enabled: !!session?.job_posting_id && status === "authenticated",
  })
  const jobTitle = jobQuery.data?.payload?.entities?.JOB_TITLE?.[0] ?? null
  const summary = session?.summary as { title?: unknown } | null | undefined
  const title =
    (typeof summary?.title === "string" && summary.title.trim()) || "Practice session"

  const report = reportQuery.data

  async function handleRetryWeakAreas() {
    if (!session || !report || isRetrying) return
    setIsRetrying(true)
    try {
      const res = await createSession(axiosAuth, {
        user_id: null,
        resume_id: session.resume_id,
        job_posting_id: session.job_posting_id,
        mode: session.mode === "TUTOR_CHAT" ? "QUICK_PRACTICE" : session.mode,
        role_level: session.role_level ?? undefined,
        focus_topics: report.weak_topics,
      })
      if (!res.success || !res.payload) throw new Error(res.message || "Could not start a session.")
      router.push(`/sessions/${res.payload.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start a session.")
      setIsRetrying(false)
    }
  }

  async function handleRegenerate() {
    if (isRegenerating) return
    setIsRegenerating(true)
    try {
      const res = await completeSession(axiosAuth, sessionId, { regenerate: true })
      queryClient.setQueryData(["session-report", sessionId], res.payload)
      if (res.payload?.generated_by === "basic") toast.info("The AI service is still unavailable.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not regenerate the report.")
    } finally {
      setIsRegenerating(false)
    }
  }

  async function handleDownloadPdf() {
    if (!report || isDownloading) return
    setIsDownloading(true)
    try {
      const [{ downloadPdfDocument, buildPdfFilenameBase }, { SessionReportPdfDocument }] =
        await Promise.all([import("@/components/pdf/download-pdf"), import("@/components/pdf/session-report-pdf")])
      await downloadPdfDocument(
        <SessionReportPdfDocument title={title} jobTitle={jobTitle} report={report} />,
        `${buildPdfFilenameBase("crackint-session-report", title, report.generated_at)}.pdf`
      )
    } catch {
      toast.error("Could not create the PDF.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (reportQuery.isError) {
    return (
      <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          {reportQuery.error instanceof Error ? reportQuery.error.message : "Could not load the report."}
        </p>
        <Button variant="outline" size="sm" onClick={() => reportQuery.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!report || !session) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <p className="text-center text-xs text-muted-foreground">Preparing your report…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/sessions/${sessionId}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Back to chat
          </Link>
          <h1 className="truncate text-xl font-semibold">{title}</h1>
          <p className="text-xs text-muted-foreground">
            Session report{jobTitle ? ` · ${jobTitle}` : ""} ·{" "}
            {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            PDF
          </Button>
          {report.weak_topics.length > 0 && (
            <Button size="sm" onClick={handleRetryWeakAreas} disabled={isRetrying}>
              {isRetrying ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Retry weak areas
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Average score"
          value={report.average_score != null ? `${Math.round(report.average_score)} / 100` : "—"}
        />
        <Stat label="Questions answered" value={String(report.questions_answered)} />
        <Stat label="Skipped" value={String(report.questions_skipped)} />
      </div>

      {report.summary && <p className="text-sm leading-relaxed">{report.summary}</p>}

      {(report.strengths.length > 0 || report.weak_topics.length > 0) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card className="flex flex-col gap-2 p-4">
            <span className="text-sm font-medium">Strengths</span>
            {report.strengths.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {report.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Answer more questions to see strengths.</p>
            )}
          </Card>
          <Card className="flex flex-col gap-2 p-4">
            <span className="text-sm font-medium">Practice next</span>
            {report.weak_topics.length ? (
              <div className="flex flex-wrap gap-1.5">
                {report.weak_topics.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No weak topics found in this session.</p>
            )}
          </Card>
        </div>
      )}

      {report.generated_by === "basic" && report.items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <span>Model answers and STAR breakdowns are unavailable because the AI service could not be reached.</span>
          <Button variant="outline" size="xs" onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating && <Loader2 className="size-3 animate-spin" />}
            Regenerate
          </Button>
        </div>
      )}

      {report.items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No answered questions in this session yet.
        </Card>
      ) : (
        <Accordion type="multiple" className="rounded-lg border border-border/60">
          {report.items.map((item) => (
            <AccordionItem key={item.index} value={String(item.index)} className="border-b border-border/60 px-4 last:border-b-0">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span
                    className={cn(
                      "inline-flex w-12 shrink-0 justify-center rounded-full py-0.5 text-xs font-semibold tabular-nums",
                      scoreClass(item.score)
                    )}
                  >
                    {item.score ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="text-muted-foreground">Q{item.index} · </span>
                    {item.topic ?? item.question}
                  </span>
                  {item.difficulty && (
                    <span className="hidden shrink-0 text-xs capitalize text-muted-foreground sm:inline">
                      {item.difficulty}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ItemDetail item={item} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
