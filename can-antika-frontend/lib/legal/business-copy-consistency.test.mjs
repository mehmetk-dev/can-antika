import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const frontendRoot = process.cwd()
const repoRoot = join(frontendRoot, "..")
const canonicalAddress = "Hüseyinağa Mah. Meşrutiyet Cad. Avrupa Pasajı No: 8 İç Kapı No: 7 Beyoğlu / İstanbul"

function readFrontend(relativePath) {
  return readFileSync(join(frontendRoot, relativePath), "utf8")
}

function readRepo(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8")
}

test("site copy keeps the legal address consistent across defaults and visible contact surfaces", () => {
  const sources = [
    readFrontend("lib/legal/business-info.ts"),
    readFrontend("lib/site-settings-context.tsx"),
    readFrontend("app/(main)/layout.tsx"),
    readFrontend("components/header/mobile-menu.tsx"),
    readRepo("e-commerce/src/main/java/com/mehmetkerem/model/config/ContactConfig.java"),
    readRepo("e-commerce/src/main/resources/templates/email/layout.html"),
  ].join("\n")

  assert.match(sources, new RegExp(canonicalAddress.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(sources, /Çukurcuma Caddesi No: 45/)
  assert.doesNotMatch(sources, /Avrupa Pasajı,\s*Beyoğlu \/ İstanbul/)
  assert.doesNotMatch(sources, /Avrupa\s+pasajı\s+No:\s*7/i)
})

test("1982 copy is framed as family experience instead of business founding date", () => {
  const sources = [
    readFrontend("app/opengraph-image.tsx"),
    readFrontend("app/(main)/layout.tsx"),
    readFrontend("app/(main)/(auth)/giris/page.tsx"),
    readFrontend("app/(main)/(bilgi)/hakkimizda/page.tsx"),
    readFrontend("components/header/mobile-menu.tsx"),
    readFrontend("components/home/featured-story.tsx"),
    readFrontend("components/home/hero-section.tsx"),
    readFrontend("components/home/trust-indicators.tsx"),
    readFrontend("lib/site-settings-context.tsx"),
    readRepo("e-commerce/src/main/java/com/mehmetkerem/model/config/SeoConfig.java"),
    readRepo("e-commerce/src/main/java/com/mehmetkerem/model/config/StoreConfig.java"),
  ].join("\n")

  assert.match(sources, /1982(?:'|&apos;|’)?den gelen aile tecrübesiyle/i)
  assert.doesNotMatch(sources, /1982(?:'|&apos;|’)?den beri/i)
  assert.doesNotMatch(sources, /Est\. 1982/i)
})

test("database migration repairs persisted legacy site settings copy", () => {
  const migration = readRepo("e-commerce/src/main/resources/db/migration/V11__normalize_site_settings_legal_copy.sql")

  assert.match(migration, new RegExp(canonicalAddress.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.match(migration, /site_settings/)
  assert.match(migration, /store_description/)
  assert.match(migration, /footer_about/)
  assert.match(migration, /meta_description/)
  assert.doesNotMatch(migration, /1982(?:'|&apos;|’)?den beri/i)
})
