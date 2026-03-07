"use client"

import * as React from "react"

/**
 * Renders children only after the component has mounted on the client.
 * Use this to avoid hydration mismatches for components that generate
 * different markup on server vs client (e.g. Radix UI IDs, useId() in certain trees).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  return mounted ? <>{children}</> : <>{fallback}</>
}
