import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const testDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(testDir, "..", "..")
const backendRoot = resolve(frontendRoot, "..", "e-commerce")
const readFrontend = (path) => readFileSync(join(frontendRoot, path), "utf8")
const readBackend = (path) => readFileSync(join(backendRoot, path), "utf8")

test("delivery addresses require and display a phone number", () => {
  const addressTypes = readFrontend("lib/types/address.ts")
  const addressPage = readFrontend("app/(main)/hesap/adresler/page.tsx")
  const addressSelector = readFrontend("components/checkout/address-selector.tsx")
  const checkoutPage = readFrontend("app/(main)/(alisveris)/siparis/page.tsx")
  const addressRequest = readBackend("src/main/java/com/mehmetkerem/dto/request/AddressRequest.java")
  const addressResponse = readBackend("src/main/java/com/mehmetkerem/dto/response/AddressResponse.java")
  const addressModel = readBackend("src/main/java/com/mehmetkerem/model/Address.java")
  const migration = readBackend("src/main/resources/db/migration/V8__add_address_phone.sql")

  assert.match(addressTypes, /phone\??:\s*string\s*\|\s*null/)
  assert.match(addressPage, /phone,\s*\n/)
  assert.match(addressPage, /TURKISH_PHONE_PATTERN/)
  assert.match(addressPage, /isValidTurkishPhone\(phone\)/)
  assert.match(addressPage, /toast\.error\("Geçerli bir telefon numarası girin"\)/)
  assert.match(addressPage, /name="phone"[\s\S]*type="tel"[\s\S]*required/)
  assert.match(addressPage, /pattern="\(\?:\(\?:\\\+\?90\|0\)/)
  assert.match(addressPage, /address\.phone/)
  assert.match(addressSelector, /addr\.phone/)
  assert.match(checkoutPage, /!selectedAddress\.phone\?\.trim\(\)/)
  assert.match(addressRequest, /private\s+String\s+phone;/)
  assert.match(addressRequest, /@Pattern\(regexp\s*=\s*"\^\(\?:\(\?:\\\\\+\?90\|0\)/)
  assert.match(addressResponse, /private\s+String\s+phone;/)
  assert.match(addressModel, /@Column\(length\s*=\s*20\)\s+private\s+String\s+phone;/)
  assert.match(addressModel, /private\s+String\s+phone;/)
  assert.match(migration, /ALTER\s+TABLE\s+addresses\s+ADD\s+COLUMN\s+phone/i)
})
