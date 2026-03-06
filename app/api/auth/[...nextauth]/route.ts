import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { login } from "@/services/auth.service"

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await login({
            email: credentials.email,
            password: credentials.password,
          })
          if (!res.success || !res.payload) return null
          const { access_token, user } = res.payload
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            accessToken: access_token,
          }
        } catch {
          return null
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
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.accessToken = token.accessToken
        session.user.id = token.id ?? token.sub ?? undefined
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

