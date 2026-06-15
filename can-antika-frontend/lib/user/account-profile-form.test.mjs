import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const accountPage = readFileSync(join(process.cwd(), "app/(main)/hesap/page.tsx"), "utf8")

test("account profile form syncs when authenticated user changes", () => {
  assert.match(accountPage, /import\s+\{\s*useEffect,\s*useState\s*\}\s+from\s+"react"/)
  assert.match(accountPage, /function\s+getProfileFormData/)
  assert.match(accountPage, /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*setFormData\(getProfileFormData\(user\)\)[\s\S]*\},\s*\[user\]\s*\)/)
})

test("password change ends the local session and redirects to login", () => {
  const authContext = readFileSync(join(process.cwd(), "lib/auth/auth-context.tsx"), "utf8")

  assert.match(authContext, /changePassword:\s*\(data:\s*ChangePasswordRequest\)\s*=>\s*Promise<void>/)
  assert.match(authContext, /const changePassword = useCallback[\s\S]*await authApi\.changePassword\(data\)[\s\S]*clearLocalSession\(\)/)
  assert.match(accountPage, /const\s+\{\s*user,\s*refreshUser,\s*changePassword\s*\}\s*=\s*useAuth\(\)/)
  assert.match(accountPage, /await changePassword\(\{[\s\S]*oldPassword:[\s\S]*newPassword:[\s\S]*\}\)/)
  assert.match(accountPage, /router\.replace\("\/giris"\)/)
})
