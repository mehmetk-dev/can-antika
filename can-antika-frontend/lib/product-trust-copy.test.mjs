import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("admin product form captures origin, restoration, and authenticity document notes", () => {
  const form = read("components/admin/product-form.tsx")

  assert.match(form, /Hikâye \/ Köken \/ Menşei/)
  assert.match(form, /Kondisyon \/ Restorasyon Notu/)
  assert.match(form, /Orijinallik ve Belge Notu/)
  assert.match(form, /authenticityNote: formData\.get\("authenticityNote"\)/)
})

test("product detail presents provenance as structured trust information", () => {
  const detail = read("components/product/product-detail.tsx")
  const utils = read("lib/product/product-utils.ts")

  assert.match(utils, /authenticityNote/)
  assert.match(detail, /Köken ve Güven Bilgileri/)
  assert.match(detail, /Fatura ile Satış/)
  assert.match(detail, /Can Antika uzman değerlendirmesiyle satışa sunulmuştur/)
  assert.doesNotMatch(detail, /detaylı hikaye ve köken bilgisi henüz eklenmedi/)
})
