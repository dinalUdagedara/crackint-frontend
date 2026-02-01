"use client"

import { summariesHardcoded } from "./summaries-hardcoded"
import SummaryCard from "./SummaryCard"

export default function SummaryView() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summariesHardcoded.map((summary) => (
        <SummaryCard key={summary.title} summary={summary} />
      ))}
    </div>
  )
}
