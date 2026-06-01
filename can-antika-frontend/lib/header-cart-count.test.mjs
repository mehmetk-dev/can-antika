import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("header guest cart count refreshes product availability before showing stale count", () => {
  const hook = read("hooks/useCartWishlistCounts.ts")

  assert.match(hook, /productApi/)
  assert.match(hook, /guestCart\.getItems\(\)/)
  assert.match(hook, /productApi\.getById/)
  assert.match(hook, /guestCart\.replaceItems/)
  assert.match(hook, /setCartCount\(refreshedItems\.length\)/)
})
