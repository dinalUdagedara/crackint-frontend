"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReadinessPayload } from "@/types/api.types"

interface JobPostingReadinessSectionProps {
  selectedResumeId: string
  onCheckReadiness: () => void
  isRoleReadinessLoading: boolean
  roleReadinessError: string | null
  roleReadiness: ReadinessPayload | null
}

export function JobPostingReadinessSection({
  selectedResumeId,
  onCheckReadiness,
  isRoleReadinessLoading,
  roleReadinessError,
  roleReadiness,
}: JobPostingReadinessSectionProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Role-specific readiness</h2>
          <p className="text-xs text-muted-foreground">
            Combined readiness score for this job and selected CV (CV match, past
            sessions, and gaps).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCheckReadiness}
          disabled={!selectedResumeId || isRoleReadinessLoading}
        >
          {isRoleReadinessLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check readiness"
          )}
        </Button>
      </div>
      {roleReadinessError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {roleReadinessError}
        </div>
      )}
      {roleReadiness && (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Readiness
            </span>
            <span className="text-sm font-semibold">
              {Math.round(roleReadiness.combined_score)} / 100
            </span>
          </div>
          {roleReadiness.cv_score !== null && (
            <span className="rounded-full bg-muted px-2.5 py-1">
              CV {Math.round(roleReadiness.cv_score)} / 100
            </span>
          )}
          {roleReadiness.session_avg !== null && (
            <span className="rounded-full bg-muted px-2.5 py-1">
              Sessions avg {Math.round(roleReadiness.session_avg)} / 100
            </span>
          )}
          {roleReadiness.gap_severity && (
            <span className="rounded-full bg-muted px-2.5 py-1">
              Gap: {roleReadiness.gap_severity}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
