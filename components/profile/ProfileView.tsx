"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, UserRound } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getMe, patchMe } from "@/services/auth.service"
import { uploadProfileImage } from "@/services/uploads.service"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HeroGradientCard } from "@/components/ui/hero-gradient-card"

export function ProfileView() {
  const queryClient = useQueryClient()
  const { data: session, status, update } = useSession()
  const axiosAuth = useAxiosAuth()
  const accessToken = session?.accessToken as string | undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => getMe(accessToken!),
    enabled: status === "authenticated" && !!accessToken,
  })

  const user = meQuery.data?.payload

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
    } else if (session?.user) {
      setName(session.user.name ?? "")
    }
  }, [user, session?.user])

  const emailDisplay = user?.email ?? session?.user?.email ?? ""
  const avatarUrl =
    user?.profile_image_url ??
    session?.user?.profileImageUrl ??
    null

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not signed in.")
      const body: { name?: string } = {}
      const baselineName = user?.name ?? session?.user?.name ?? ""
      const nextName = name.trim()
      if (nextName !== baselineName) body.name = nextName
      if (Object.keys(body).length === 0) {
        throw new Error("NO_CHANGES")
      }
      if (body.name !== undefined && body.name.length < 1) {
        throw new Error("Name cannot be empty.")
      }
      return patchMe(accessToken, body)
    },
    onSuccess: async (res) => {
      if (!res.success || !res.payload) {
        toast.error(res.message || "Could not update profile.")
        return
      }
      await update({
        name: res.payload.name,
        email: res.payload.email ?? session?.user?.email ?? undefined,
        profileImageUrl: res.payload.profile_image_url ?? null,
      })
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Profile updated.")
    },
    onError: (err: Error) => {
      if (err.message === "NO_CHANGES") {
        toast.message("No changes to save.")
        return
      }
      toast.error(err.message)
    },
  })

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!accessToken) throw new Error("Not signed in.")
      const url = await uploadProfileImage(axiosAuth, file)
      return patchMe(accessToken, { profile_image_url: url })
    },
    onSuccess: async (res) => {
      if (!res.success || !res.payload) {
        toast.error(res.message || "Could not save photo.")
        return
      }
      await update({
        name: res.payload.name,
        email: res.payload.email ?? session?.user?.email ?? undefined,
        profileImageUrl: res.payload.profile_image_url ?? null,
      })
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Profile photo updated.")
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removePhotoMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not signed in.")
      return patchMe(accessToken, { profile_image_url: null })
    },
    onSuccess: async (res) => {
      if (!res.success || !res.payload) {
        toast.error(res.message || "Could not remove photo.")
        return
      }
      await update({
        name: res.payload.name,
        email: res.payload.email ?? session?.user?.email ?? undefined,
        profileImageUrl: null,
      })
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      toast.success("Profile photo removed.")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (status === "loading" || (status === "authenticated" && meQuery.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status !== "authenticated") {
    return null
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          <HeroGradientCard>
            <div className="flex items-start gap-4">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary ring-1 ring-border/60">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- S3 public URLs
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your display name or profile photo. Email cannot be
                  changed here.
                </p>
              </div>
            </div>
          </HeroGradientCard>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Profile photo</CardTitle>
              <CardDescription>
                JPEG, PNG, or WebP, up to 5 MB. Requires S3 uploads on the
                server.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) photoMutation.mutate(file)
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={photoMutation.isPending || removePhotoMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload photo"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={
                  !avatarUrl ||
                  photoMutation.isPending ||
                  removePhotoMutation.isPending
                }
                onClick={() => removePhotoMutation.mutate()}
              >
                {removePhotoMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  "Remove photo"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Account details</CardTitle>
              <CardDescription>
                Name changes apply on the server and in this session. For the
                latest data, the app uses GET /auth/me.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveMutation.mutate()
                }}
              >
                {meQuery.isError && (
                  <p className="text-sm text-destructive" role="alert">
                    {meQuery.error instanceof Error
                      ? meQuery.error.message
                      : "Could not load profile."}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input
                    id="profile-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saveMutation.isPending}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    readOnly
                    autoComplete="email"
                    value={emailDisplay}
                    className="rounded-xl bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support if you need to change your sign-in email.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
