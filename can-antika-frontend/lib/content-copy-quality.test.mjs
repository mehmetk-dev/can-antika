import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("home and about copy does not split words with decorative drop caps", () => {
  const homeStory = read("components/home/featured-story.tsx")
  const aboutPage = read("app/(main)/(bilgi)/hakkimizda/page.tsx")

  assert.doesNotMatch(homeStory, />1<\/span>982/)
  assert.doesNotMatch(aboutPage, />\s*A\s*<\/span>\s*ntika/)
  assert.match(homeStory, /1982 yılında Orhan Can/)
  assert.match(aboutPage, /Antika ile tanışmam/)
})

test("about page browser title stays focused on Hakkımızda and Can Antika", () => {
  const aboutPage = read("app/(main)/(bilgi)/hakkimizda/page.tsx")

  assert.match(aboutPage, /title:\s*"Hakkımızda"/)
  assert.match(aboutPage, /openGraph:\s*{\s*title:\s*"Hakkımızda \| Can Antika"/)
  assert.doesNotMatch(aboutPage, /title:\s*"[^"]*Mesut Can/)
})

test("cookie consent UI exposes reject, manage, save, and later settings controls", () => {
  const banner = read("components/legal/cookie-consent-banner.tsx")
  const policy = read("app/(main)/(yasal)/cerezler/page.tsx")
  const tracking = read("components/legal/consent-managed-tracking.tsx")

  assert.match(banner, /Hepsini Kabul Et/)
  assert.match(banner, /Hepsini Reddet/)
  assert.match(banner, /Tercihleri Yönet/)
  assert.match(banner, /Tercihleri Kaydet/)
  assert.match(policy, /CookieConsentSettingsButton/)
  assert.match(tracking, /consent\?\.analytics/)
  assert.match(tracking, /consent\?\.marketing/)
})
