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
