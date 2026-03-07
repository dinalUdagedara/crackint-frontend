"use client"

import { useEffect, type ReactNode } from "react"
import { SessionProvider, signOut } from "next-auth/react"
import { set401Handler } from "@/lib/api-client"

interface AuthProviderProps {
  children: ReactNode
}

function Auth401Handler() {
  useEffect(() => {
    set401Handler(() => {
      void signOut({ callbackUrl: "/login", redirect: true })
    })
    return () => set401Handler(null)
  }, [])
  return null
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <Auth401Handler />
      {children}
    </SessionProvider>
  )
}

