import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), "utf8")

test("product detail does not allow repeated add-to-cart notifications after add", () => {
  const hook = read("hooks/useProductActions.ts")
  const detail = read("components/product/product-detail.tsx")

  assert.match(hook, /if\s*\(\s*addingToCart\s*\|\|\s*addedToCart\s*\)/)
  assert.match(detail, /<QuantitySelector[\s\S]*disabled=\{addingToCart\s*\|\|\s*addedToCart\}/)
  assert.match(detail, /disabled=\{addingToCart\s*\|\|\s*addedToCart\}/)
})

test("guest cart reports when an existing item is already at stock limit", () => {
  const guestCart = read("lib/commerce/guest-cart.ts")

  assert.match(guestCart, /existing\.quantity\s*>=\s*maxAllowed/)
  assert.match(guestCart, /throw new Error\("Bu ürün zaten sepetinizde\."\)/)
})

test("login syncs guest cart before exposing authenticated state", () => {
  const authContext = read("lib/auth/auth-context.tsx")
  const loginBlock = authContext.slice(
    authContext.indexOf("const login = useCallback"),
    authContext.indexOf("const register = useCallback"),
  )
  const syncIndex = loginBlock.indexOf("guestCart.toSyncPayload()")
  const setUserIndex = loginBlock.indexOf("setUser(user);")

  assert.ok(syncIndex >= 0)
  assert.ok(setUserIndex > syncIndex)
})
