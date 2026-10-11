import type { AxiosInstance } from "axios"
import { createSession } from "@/services/sessions.service"
import type { PrepPlan, PrepPlanTask } from "@/types/api.types"

/** Deadline tasks open the cover letter editor; the others start a practice session. */
export function planTaskHref(plan: PrepPlan, task: PrepPlanTask): string | null {
  if (task.kind !== "deadline") return null
  const params = new URLSearchParams({ job_posting_id: plan.job_posting_id })
  if (plan.resume_id) params.set("resume_id", plan.resume_id)
  return `/cover-letter?${params.toString()}`
}

/** Create the practice session for a plan task; returns the new session id. */
export async function startPlanTask(
  axiosAuth: AxiosInstance,
  plan: PrepPlan,
  task: PrepPlanTask
): Promise<string> {
  // TARGETED needs both a resume and a job; without a resume fall back to quick practice.
  const mode = plan.resume_id ? task.mode : "QUICK_PRACTICE"
  const res = await createSession(axiosAuth, {
    user_id: null,
    resume_id: plan.resume_id,
    job_posting_id: plan.job_posting_id,
    mode,
    focus_topics: task.focus_topics,
  })
  if (!res.success || !res.payload) {
    throw new Error(res.message || "Could not start the session.")
  }
  return res.payload.id
}
