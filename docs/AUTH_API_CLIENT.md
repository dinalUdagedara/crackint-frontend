# Auth API client pattern

## Default: client-side `axiosAuth` from `useAxiosAuth()`

- **Shared instance**: `[lib/axios.ts](lib/axios.ts)` exports `axiosAuth`, an Axios instance with `baseURL: API_V1` (e.g. `http://localhost:8000/api/v1`), JSON headers, and timeout.
- **Hook**: `[lib/hooks/useAxiosAuth.ts](lib/hooks/useAxiosAuth.ts)` — in client components, registers **request** (inject `Authorization: Bearer <session.accessToken>`) and **response** (on 401: call centralized handler, then reject) interceptors on `axiosAuth`, then returns that same instance. Interceptors are cleaned up on unmount.
- **401**: A single handler is registered in `[AuthProvider](components/providers/auth-provider.tsx)` via `set401Handler` in `[lib/api-client.ts](lib/api-client.ts)` to run `signOut({ callbackUrl: "/login", redirect: true })`. The Axios response interceptor calls this on 401. There is **no refresh token** (backend has no refresh endpoint).

## Usage in components

In any client component that needs to call the backend:

```tsx
"use client"
import { useAxiosAuth } from "@/lib/hooks/useAxiosAuth"
import { listSessions } from "@/services/sessions.service"

function MyComponent() {
  const axiosAuth = useAxiosAuth()

  const { data } = await listSessions(axiosAuth, 1, 20)
  // or call axiosAuth directly:
  // const { data } = await axiosAuth.get("/sessions", { params: { page: 1, page_size: 20 } })
}
```

- **Services** that need auth take `axiosAuth` as the first argument (e.g. `listSessions(axiosAuth, page, pageSize)`, `createSession(axiosAuth, body)`). Token and 401 handling live only in the interceptors.
- Do **not** pass `accessToken` for normal API calls; use `axiosAuth` from the hook (or pass it into services).

## Server-side backend calls (when needed)

Use client-side `axiosAuth` for all usual UI flows (user-triggered actions, client-side data fetching, mutations). Add **server-side** backend calls only when you have a concrete requirement, e.g.:

- **SSR with protected data**: A page that must render authenticated content on first load without sending the token to the client. Use a Server Component or Server Action that calls `getServerSession(authOptions)`, then `fetch(backendUrl, { headers: { Authorization: Bearer <token> } })` from the server.
- **Hiding backend URL or token**: If the backend URL or token must not be exposed to the client, perform the call from the server (Server Action or API route) using `getServerSession` + `fetch`.

Implementation idea: a small server helper (e.g. `getAuthFetchServer()`) that runs `const session = await getServerSession(authOptions)` and returns a `fetch`-like that adds `Authorization: Bearer <session?.accessToken>`. Use it only in Server Actions or API routes. Do not add this until you have a concrete use case.

## Summary

- **One place** for "add Bearer token and handle 401": the Axios instance and interceptors from `useAxiosAuth()`.
- **Components** use `axiosAuth` from the hook; **services** that need auth receive `axiosAuth` as an argument.
- **401** is handled in a single, centralized way (signOut + redirect to `/login`).
- **No refresh**: On 401, the only behavior is to run the handler above; optional: show a short "Session expired, please sign in again" message.
