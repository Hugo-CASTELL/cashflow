import { type FormEvent, useState } from "react"
import { redirect, useNavigate, useSearchParams } from "react-router"
import type { Route } from "./+types/auth"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { api, ApiError } from "~/lib/api"
import {
  clearSession,
  getSecretFromRequest,
  persistSession,
} from "~/lib/auth"
import { cn } from "~/lib/utils"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign in · Cashflow" },
    { name: "description", content: "Authenticate with your account secret" },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const secret = getSecretFromRequest(request)
  if (!secret) {
    return { alreadySignedIn: false }
  }

  try {
    await api.getMe(secret, true)
    const url = new URL(request.url)
    const next = url.searchParams.get("next") || "/"
    throw redirect(next.startsWith("/") ? next : "/")
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    return { alreadySignedIn: false }
  }
}

function parseApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 401) {
    return "That secret is not valid."
  }

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string }
      if (parsed.message) {
        return parsed.message
      }
    } catch {
      // not JSON
    }

    return error.message || fallback
  }

  return fallback
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<"signin" | "create">("signin")
  const [secret, setSecret] = useState("")
  const [name, setName] = useState("")
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const nextPath = (() => {
    const next = searchParams.get("next") || "/"
    return next.startsWith("/") ? next : "/"
  })()

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextSecret = secret.trim()
    if (!nextSecret) {
      setError("Secret is required")
      return
    }

    setError(null)
    setPending(true)

    try {
      const account = await api.authenticate({ secret: nextSecret })
      persistSession(nextSecret, account.name)
      navigate(nextPath, { replace: true })
    } catch (err) {
      clearSession()
      setError(parseApiErrorMessage(err, "Could not sign in"))
    } finally {
      setPending(false)
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName) {
      setError("Name is required")
      return
    }

    setError(null)
    setPending(true)

    try {
      const account = await api.createAccount({ name: nextName })
      setCreatedSecret(account.secret)
      persistSession(account.secret, account.name)
    } catch (err) {
      setError(parseApiErrorMessage(err, "Could not create account"))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.97_0.01_250),_oklch(1_0_0)_55%)] px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-3xl font-semibold tracking-tight">Cashflow</p>
          <p className="text-sm text-muted-foreground">
            Use your account secret to open categories and transactions for that
            account only.
          </p>
        </div>

        <div className="rounded-2xl border bg-background/90 p-5 shadow-sm backdrop-blur sm:p-6">
          {createdSecret ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight">
                  Account created
                </h1>
                <p className="text-sm text-muted-foreground">
                  Save this secret now. It is the only way to access this
                  account later.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-secret">Account secret</Label>
                <textarea
                  id="created-secret"
                  readOnly
                  value={createdSecret}
                  className="min-h-24 w-full rounded-lg border border-input bg-muted/40 px-2.5 py-2 font-mono text-xs leading-relaxed"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                onClick={() => navigate(nextPath, { replace: true })}
              >
                Continue to app
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    mode === "signin"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setMode("signin")
                    setError(null)
                  }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    mode === "create"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setMode("create")
                    setError(null)
                  }}
                >
                  Create account
                </button>
              </div>

              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secret">Account secret</Label>
                    <Input
                      id="secret"
                      name="secret"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Paste your secret"
                      value={secret}
                      onChange={(event) => setSecret(event.target.value)}
                      required
                    />
                  </div>
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                  >
                    {pending ? "Checking…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Account name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="organization"
                      placeholder="Household, Travel, …"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                  >
                    {pending ? "Creating…" : "Create account"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
