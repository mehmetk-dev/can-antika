import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8")
}

test("checkout exposes separate pre-information and distance sales links", () => {
  const summary = read("components/checkout/order-summary.tsx")
  const checkout = read("app/(main)/(alisveris)/siparis/page.tsx")
  const distanceSales = read("app/(main)/(yasal)/mesafeli-satis-sozlesmesi/page.tsx")

  assert.ok(existsSync(join(root, "app/(main)/(yasal)/on-bilgilendirme-formu/page.tsx")))
  assert.ok(existsSync(join(root, "components/checkout/legal-documents-panel.tsx")))
  assert.match(checkout, /<LegalDocumentsPanel/)
  assert.match(summary, /href="\/on-bilgilendirme-formu"/)
  assert.match(summary, /href="\/mesafeli-satis-sozlesmesi"/)
  assert.doesNotMatch(distanceSales, /href="\/mesafeli-satis-sozlesmesi"[^>]*>Ön Bilgilendirme Formu/)
})

test("checkout renders scrollable legal documents before payment approval", () => {
  const legalPanel = read("components/checkout/legal-documents-panel.tsx")
  const summary = read("components/checkout/order-summary.tsx")
  const preInformationPage = read("app/(main)/(yasal)/on-bilgilendirme-formu/page.tsx")
  const distanceSalesPage = read("app/(main)/(yasal)/mesafeli-satis-sozlesmesi/page.tsx")
  const returnPolicyPage = read("app/(main)/(yasal)/iade/page.tsx")
  const sharedDocuments = read("lib/legal/legal-documents.ts")

  assert.match(legalPanel, /SÖZLEŞMELER VE FORMLAR/)
  assert.match(legalPanel, /Ön Bilgilendirme Formu/)
  assert.match(legalPanel, /Mesafeli Satış Sözleşmesi/)
  assert.match(legalPanel, /Cayma Hakkı/)
  assert.match(legalPanel, /max-h-40 overflow-y-auto/)
  assert.ok(existsSync(join(root, "lib/legal/legal-documents.ts")))
  assert.ok(existsSync(join(root, "components/legal/legal-document-content.tsx")))
  assert.match(sharedDocuments, /PRE_INFORMATION_SECTIONS/)
  assert.match(sharedDocuments, /DISTANCE_SALES_SECTIONS/)
  assert.match(sharedDocuments, /RETURN_POLICY_SECTIONS/)
  assert.doesNotMatch(legalPanel, /const PRE_INFORMATION_SECTIONS/)
  assert.match(legalPanel, /from "@\/lib\/legal\/legal-documents"/)
  assert.match(preInformationPage, /PRE_INFORMATION_SECTIONS/)
  assert.match(distanceSalesPage, /DISTANCE_SALES_SECTIONS/)
  assert.match(returnPolicyPage, /RETURN_POLICY_SECTIONS/)
  assert.match(summary, /Aşağıdaki sözleşme ve formları/)
})

test("cookie consent gates analytics and marketing scripts", () => {
  const providers = read("app/providers.tsx")
  const layout = read("app/layout.tsx")
  const tracking = read("components/legal/consent-managed-tracking.tsx")

  assert.ok(existsSync(join(root, "components/legal/cookie-consent-banner.tsx")))
  assert.match(providers, /CookieConsentBanner/)
  assert.match(layout, /ConsentManagedTracking/)
  assert.doesNotMatch(layout, /googletagmanager\.com\/gtag\/js/)
  assert.doesNotMatch(layout, /connect\.facebook\.net\/en_US\/fbevents\.js/)
  assert.match(tracking, /function parseConsent/)
  assert.match(tracking, /parseConsent\(rawConsent\)/)
  assert.match(tracking, /catch/)
})

test("footer does not advertise inactive PayTR or 3D Secure integrations", () => {
  const footer = read("components/layout/footer.tsx")

  assert.doesNotMatch(footer, /paytr/i)
  assert.doesNotMatch(footer, /3d-secure|3D Secure/i)
  assert.match(footer, /paymentLogos/)
  assert.match(footer, /next\/image/)
  assert.match(footer, /unoptimized/)
})

test("checkout hides credit card until PayTR credentials are available", () => {
  const checkout = read("app/(main)/(alisveris)/siparis/page.tsx")
  const selector = read("components/checkout/payment-method-selector.tsx")

  assert.match(checkout, /useState<"CREDIT_CARD" \| "EFT" \| "CASH_ON_DELIVERY">\("EFT"\)/)
  assert.doesNotMatch(selector, /value: "CREDIT_CARD" as const, label:/)
  assert.doesNotMatch(selector, /\["CREDIT_CARD" as const\]/)
})

test("cookie settings are reopened from the cookie policy page, not a permanent corner button", () => {
  const banner = read("components/legal/cookie-consent-banner.tsx")
  const cookiePolicy = read("app/(main)/(yasal)/cerezler/page.tsx")

  assert.match(cookiePolicy, /CookieConsentSettingsButton/)
  assert.doesNotMatch(banner, /fixed bottom-3 left-3/)
})
