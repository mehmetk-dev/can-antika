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
