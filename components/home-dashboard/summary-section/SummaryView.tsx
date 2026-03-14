"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getHomeSummary } from "@/services/readiness.service"
import type { HomeSummaryCard } from "@/types/api.types"
import { summariesHardcoded } from "./summaries-hardcoded"
import SummaryCard from "./SummaryCard"

export default function SummaryView() {
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()

  const { data } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async () => {
      const res = await getHomeSummary(axiosAuth)
      return res.payload
    },
    enabled: status === "authenticated",
  })

  const cards: HomeSummaryCard[] =
    data?.cards && data.cards.length > 0 ? data.cards : summariesHardcoded

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 min-h-0 min-w-0">
      {cards.map((summary, index) => (
        <div
          key={(summary as HomeSummaryCard).id ?? `${summary.title}-${index}`}
          className="min-w-0"
        >
          <SummaryCard summary={summary} />
        </div>
      ))}
    </div>
  )
}
