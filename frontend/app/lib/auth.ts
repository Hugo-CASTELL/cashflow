const SECRET_COOKIE = "cashflow_secret"
const SECRET_STORAGE_KEY = "cashflow_secret"
const ACCOUNT_NAME_KEY = "cashflow_account_name"

export function parseCookieValue(
  cookieHeader: string | null | undefined,
  name: string
): string | null {
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=")
    if (rawKey === name) {
      const value = rest.join("=").trim()
      if (value === "") {
        return null
      }

      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }
  }

  return null
}

export function getSecretFromRequest(request: Request): string | null {
  return parseCookieValue(request.headers.get("Cookie"), SECRET_COOKIE)
}

export function getStoredSecret(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const fromStorage = window.localStorage.getItem(SECRET_STORAGE_KEY)?.trim()
  if (fromStorage) {
    return fromStorage
  }

  return parseCookieValue(document.cookie, SECRET_COOKIE)
}

export function getStoredAccountName(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(ACCOUNT_NAME_KEY)
}

export function persistSession(secret: string, accountName?: string | null): void {
  const trimmed = secret.trim()
  if (typeof window === "undefined" || trimmed === "") {
    return
  }

  window.localStorage.setItem(SECRET_STORAGE_KEY, trimmed)
  if (accountName && accountName.trim() !== "") {
    window.localStorage.setItem(ACCOUNT_NAME_KEY, accountName.trim())
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : ""
  document.cookie = `${SECRET_COOKIE}=${encodeURIComponent(trimmed)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(SECRET_STORAGE_KEY)
  window.localStorage.removeItem(ACCOUNT_NAME_KEY)
  document.cookie = `${SECRET_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function buildSecretCookieHeader(secret: string): string {
  return `${SECRET_COOKIE}=${encodeURIComponent(secret.trim())}`
}

export { SECRET_COOKIE }
