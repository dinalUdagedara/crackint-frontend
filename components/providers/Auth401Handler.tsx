import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { set401Handler } from "@/lib/api-client"

export function Auth401Handler() {
  useEffect(() => {
    set401Handler(() => {
      void signOut({ callbackUrl: "/login", redirect: true })
    })
    return () => set401Handler(null)
  }, [])

  return null
}

