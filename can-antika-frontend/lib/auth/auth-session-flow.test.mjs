import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function read(path) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

test("expired refresh invalidates AuthContext state", () => {
  const apiClient = read("lib/api-client.ts")
  const authSession = read("lib/auth/auth-session.ts")
  const authContext = read("lib/auth/auth-context.tsx")

  assert.match(authSession, /export const AUTH_SESSION_INVALIDATED_EVENT/)
  assert.match(authSession, /export function invalidateAuthSession\(\)/)
  assert.match(apiClient, /invalidateAuthSession\(\)/)
  assert.match(authContext, /addEventListener\(AUTH_SESSION_INVALIDATED_EVENT,\s*handleSessionInvalidated\)/)
  assert.match(authContext, /const handleSessionInvalidated = \(\) => setUser\(null\)/)
})

test("logout completes before navigation so its cookie cleanup cannot race a new login", () => {
  const authContext = read("lib/auth/auth-context.tsx")
  const header = read("components/header/header-client-island.tsx")
  const sidebar = read("components/dashboard/sidebar.tsx")

  assert.match(authContext, /logout:\s*\(\)\s*=>\s*Promise<void>/)
  assert.match(authContext, /const logout = useCallback\(async \(\) =>/)
  assert.match(authContext, /await authApi\.logout\(\)/)
  assert.match(header, /const handleLogout = async \(\) => \{[\s\S]*await logout\(\)[\s\S]*router\.push\("\/"\)/)
  assert.match(sidebar, /const handleLogout = async \(\) => \{[\s\S]*await logout\(\)[\s\S]*router\.push\("\/"\)/)
})

test("session-expiry messages preserve Turkish characters", () => {
  const apiClient = read("lib/api-client.ts")

  assert.doesNotMatch(apiClient, /Oturum sÃ¼resi doldu/)
  assert.match(apiClient, /Oturum süresi doldu\. Lütfen tekrar giriş yapın\./)
  assert.match(apiClient, /Bu işlem için giriş yapmanız gerekiyor\./)
})
