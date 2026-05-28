import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), "utf8")

test("header search opens below the header without entering desktop nav flow", () => {
  const search = read("components/header/header-search.tsx")

  assert.match(search, /top-full/)
  assert.match(search, /max-w-2xl/)
  assert.doesNotMatch(search, /sm:static/)
})

test("header search closes when route changes", () => {
  const island = read("components/header/header-client-island.tsx")

  assert.match(island, /usePathname/)
  assert.match(island, /searchState\.pathname === pathname/)
})
