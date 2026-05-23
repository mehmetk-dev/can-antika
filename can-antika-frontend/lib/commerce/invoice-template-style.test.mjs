import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("invoice download template follows email visual style", () => {
  const template = read("lib/commerce/invoice-template.ts")

  assert.match(template, /Cinzel/)
  assert.match(template, /Cormorant Garamond/)
  assert.match(template, /#f9f6f0/)
  assert.match(template, /#fffdf8/)
  assert.match(template, /#7b4019/)
  assert.match(template, /#d2bf97/)
  assert.match(template, /Geçmişin İzi, Geleceğin Mirası/)
  assert.match(template, /CAN ANTİKA/)
  assert.doesNotMatch(template, /#1a1a2e/)
  assert.doesNotMatch(template, /EST\. 1982/)
})
