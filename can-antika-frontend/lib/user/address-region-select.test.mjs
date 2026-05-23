import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const testDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(testDir, "..", "..")
const backendRoot = resolve(frontendRoot, "..", "e-commerce")
const readFrontend = (path) => readFileSync(join(frontendRoot, path), "utf8")
const readBackend = (path) => readFileSync(join(backendRoot, path), "utf8")

test("address form uses Turkiye API backed province district neighborhood selects", () => {
  const addressPage = readFrontend("app/(main)/hesap/adresler/page.tsx")
  const turkiyeClient = readFrontend("lib/geo/turkiye-address.ts")
  const route = readFrontend("app/api/turkiye-address/[kind]/route.ts")
  const addressTypes = readFrontend("lib/types/address.ts")
  const addressSelector = readFrontend("components/checkout/address-selector.tsx")
  const addressRequest = readBackend("src/main/java/com/mehmetkerem/dto/request/AddressRequest.java")
  const addressResponse = readBackend("src/main/java/com/mehmetkerem/dto/response/AddressResponse.java")
  const addressModel = readBackend("src/main/java/com/mehmetkerem/model/Address.java")

  assert.ok(existsSync(join(backendRoot, "src/main/resources/db/migration/V9__add_address_neighborhood.sql")))
  assert.match(route, /api\.turkiyeapi\.dev\/v1/)
  assert.match(route, /neighborhoods/)
  assert.match(route, /villages/)
  assert.match(turkiyeClient, /getTurkiyeAddressUnits/)
  assert.match(addressPage, /from "@\/components\/ui\/select"/)
  assert.match(addressPage, /getTurkiyeAddressUnits/)
  assert.match(addressPage, /name="city"/)
  assert.match(addressPage, /name="district"/)
  assert.match(addressPage, /name="neighborhood"/)
  assert.match(addressPage, /selectedProvinceId/)
  assert.match(addressPage, /selectedDistrictId/)
  assert.match(addressPage, /Mahalle \/ K\u00f6y/)
  assert.match(addressTypes, /neighborhood\??:\s*string\s*\|\s*null/)
  assert.match(addressSelector, /addr\.neighborhood/)
  assert.match(addressRequest, /private\s+String\s+neighborhood;/)
  assert.match(addressResponse, /private\s+String\s+neighborhood;/)
  assert.match(addressModel, /private\s+String\s+neighborhood;/)
})
