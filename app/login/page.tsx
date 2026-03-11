"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error("Please enter email and password.")
      return
    }
    setIsLoading(true)
    console.log("[auth] login page: signIn(credentials) starting for", email.trim())
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })
      console.log("[auth] login page: signIn result", {
        ok: res?.ok,
        error: res?.error,
        status: res?.status,
        url: res?.url,
      })
      if (res?.error) {
        console.log("[auth] login page: signIn failed, error:", res.error)
        const message =
          res.error === "CredentialsSignin"
            ? "Invalid email or password."
            : res.error === "OAuthSignin"
              ? "Sign-in failed. Check that the backend is running and your email/password are correct. See terminal for server logs."
              : res.error
        toast.error(message, { duration: 6000 })
        setIsLoading(false)
        return
      }
      if (!res?.ok) {
        console.log("[auth] login page: signIn returned not ok, no error field")
        toast.error("Sign in failed. Check the server logs.")
        setIsLoading(false)
        return
      }
      console.log("[auth] login page: signIn success, redirecting to", callbackUrl)
      toast.success("Signed in.")
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      console.error("[auth] login page: signIn exception", err instanceof Error ? err.message : err)
      toast.error("Something went wrong.")
      setIsLoading(false)
    }
  }

  function handleGoogle() {
    signIn("google", { callbackUrl })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your account or sign in with Google.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              className="h-9"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={isLoading}>
          Sign in with Google
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
