"use client"

import { summariesHardcoded } from "./summaries-hardcoded"
import SummaryCard from "./SummaryCard"

export default function SummaryView() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 min-h-0">
      {summariesHardcoded.map((summary) => (
        <SummaryCard key={summary.title} summary={summary} />
      ))}
    </div>
  )
}
