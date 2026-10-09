"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { getHomeSummary } from "@/services/readiness.service"
import SummaryCard from "./SummaryCard"

const SKELETON_CARD_COUNT = 3

function SummarySkeletonCard() {
  return (
    <Card className="flex min-h-[200px] flex-col gap-4 border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </Card>
  )
}

export default function SummaryView() {
  const axiosAuth = useAxiosAuth()
  const { status } = useSession()

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["home-summary"],
    queryFn: async () => {
      const res = await getHomeSummary(axiosAuth)
      return res.payload
    },
    enabled: status === "authenticated",
  })

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-3 border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load your summary.
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          Try again
        </Button>
      </Card>
    )
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 min-h-0 min-w-0">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
          <div key={i} className="min-w-0">
            <SummarySkeletonCard />
          </div>
        ))}
      </div>
    )
  }

  const cards = data?.cards ?? []

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 min-h-0 min-w-0">
      {cards.map((summary, index) => (
        <div key={summary.id ?? `${summary.title}-${index}`} className="min-w-0">
          <SummaryCard summary={summary} />
        </div>
      ))}
    </div>
  )
}
