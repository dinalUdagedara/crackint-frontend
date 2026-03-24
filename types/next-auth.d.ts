import "next-auth"
import "next-auth/jwt"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      /** Mirrors backend `user.is_admin` from login / Google exchange. */
      isAdmin?: boolean
    } & DefaultSession["user"]
  }
  interface User {
    id?: string
    accessToken?: string
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    id?: string
    isAdmin?: boolean
  }
}
