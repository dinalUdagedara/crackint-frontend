"use client"

import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Resume, SkillGapPayload } from "@/types/api.types"

interface JobPostingSkillGapSectionProps {
  resumes: Resume[]
  resumesPending: boolean
  selectedResumeId: string
  onResumeChange: (id: string) => void
  onAnalyze: () => void
  isSkillGapLoading: boolean
  isAnalyzing: boolean
  skillGapError: string | null
  skillGapResult: SkillGapPayload | null
  /** When true, Analyze button is disabled (e.g. when job is not selected on match page). */
  analyzeDisabled?: boolean
  /** When true, hide resume selector and section title (e.g. match page has its own pickers). */
  compactMode?: boolean
}

export function JobPostingSkillGapSection({
  resumes,
  resumesPending,
  selectedResumeId,
  onResumeChange,
  onAnalyze,
  isSkillGapLoading,
  isAnalyzing,
  skillGapError,
  skillGapResult,
  analyzeDisabled = false,
  compactMode = false,
}: JobPostingSkillGapSectionProps) {
  const isLoading = isSkillGapLoading || isAnalyzing
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      {!compactMode && (
        <>
          <h2 className="text-sm font-medium">Check match with my CV</h2>
          <p className="text-xs text-muted-foreground">
            Compare your resume with this job posting to see missing skills and
            suggestions.
          </p>
        </>
      )}
      {compactMode && !skillGapResult && !skillGapError && !isLoading && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Select a resume and job above, then click <strong>Analyze match</strong>. Results will appear here.
        </p>
      )}
      {compactMode && isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading analysis...</span>
        </div>
      )}
      {!compactMode && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] space-y-1.5">
            <Label htmlFor="skill-gap-resume">Resume</Label>
            <Select
              value={selectedResumeId}
              onValueChange={onResumeChange}
              disabled={resumesPending}
            >
              <SelectTrigger id="skill-gap-resume" className="rounded-xl">
                <SelectValue
                  placeholder={
                    resumesPending
                      ? "Loading..."
                      : resumes.length
                        ? "Select a resume"
                        : "No resumes available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.entities?.NAME?.[0] ?? r.id.slice(0, 8) + "..."}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={!selectedResumeId || isLoading || analyzeDisabled}
            className="rounded-xl px-5 font-medium shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {isAnalyzing ? "Analyzing..." : "Loading..."}
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
      )}
      {skillGapError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {skillGapError}
        </div>
      )}
      {skillGapResult && (
        <div className="space-y-4 pt-2">
          {skillGapResult.analyzed_at && (
            <p className="text-xs text-muted-foreground">
              Analyzed{" "}
              {new Date(skillGapResult.analyzed_at).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
          {skillGapResult.llm_fit_analysis && (
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-xs font-medium text-muted-foreground">
                AI fit analysis
              </h3>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {skillGapResult.llm_fit_analysis.fit_score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100 fit</span>
              </div>
              <p className="text-sm leading-relaxed">
                {skillGapResult.llm_fit_analysis.summary}
              </p>
              {skillGapResult.llm_fit_analysis.tailored_suggestions.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Tailored suggestions
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {skillGapResult.llm_fit_analysis.tailored_suggestions.map(
                      (s, i) => (
                        <li key={i}>{s}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {skillGapResult.alerts.length > 0 && (
            <div className="space-y-2">
              {skillGapResult.alerts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
                    a.severity === "high"
                      ? "border border-destructive/50 bg-destructive/10 text-destructive"
                      : a.severity === "medium"
                        ? "border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border border-muted bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {a.message}
                </div>
              ))}
            </div>
          )}
          {skillGapResult.missing_skills.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                Missing skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillGapResult.missing_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skillGapResult.suggestions.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                Suggestions
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {skillGapResult.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
