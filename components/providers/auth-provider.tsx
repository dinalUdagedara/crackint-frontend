"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { Auth401Handler } from "./Auth401Handler"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <Auth401Handler />
      {children}
    </SessionProvider>
  )
}

