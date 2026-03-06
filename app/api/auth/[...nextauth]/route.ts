import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { login } from "@/services/auth.service"

// Use a stable secret so the session cookie can be decrypted on refresh. If NEXTAUTH_SECRET
// is missing in dev, NextAuth would use a random secret per process and you'd be logged out on refresh.
const secret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development"
    ? "crackint-dev-secret-set-NEXTAUTH_SECRET-in-env-for-production"
    : undefined)

if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] NEXTAUTH_SECRET is not set in .env. Using a dev fallback so session survives refresh. Set NEXTAUTH_SECRET for production."
    )
  } else {
    console.error("[auth] NEXTAUTH_SECRET is not set. Session cookie will be invalid. Set NEXTAUTH_SECRET in .env.")
  }
}

export const authOptions = {
  secret,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] credentials authorize: missing email or password")
          return null
        }
        console.log("[auth] credentials authorize: calling backend login for", credentials.email)
        try {
          const res = await login({
            email: credentials.email,
            password: credentials.password,
          })
          if (!res.success || !res.payload) {
            const msg = res.message || "Login failed."
            console.log("[auth] credentials authorize: backend returned no success or payload", {
              success: res.success,
              message: res.message,
            })
            throw new Error(msg)
          }
          const { access_token, user } = res.payload
          console.log("[auth] credentials authorize: success, user id:", user.id)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            accessToken: access_token,
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login failed."
          console.error("[auth] credentials authorize: exception", message)
          throw new Error(message)
        }
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      httpOptions: { timeout: 15000 },
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account", // Always show account picker (avoids silent re-login after logout)
        },
      },
    }),
  ],
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (default). Use e.g. 60 * 60 for 1 hour in dev.
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken
        token.id = user.id
        console.log("[auth] jwt callback: user present, id:", user.id)
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.accessToken = token.accessToken
        session.user.id = token.id ?? token.sub ?? undefined
        console.log("[auth] session callback: session populated, hasAccessToken:", !!token.accessToken)
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

