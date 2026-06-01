import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("footer payment logos use compact cards with per-logo sizing", () => {
  const footer = read("components/layout/footer.tsx")

  assert.match(footer, /width: 58/)
  assert.match(footer, /height: 20/)
  assert.match(footer, /className: "h-4 w-auto"/)
  assert.match(footer, /w-\[76px\]/)
  assert.match(footer, /h-9/)
  assert.doesNotMatch(footer, /w-\[104px\]/)
  assert.doesNotMatch(footer, /h-10 w-\[104px\]/)
})
