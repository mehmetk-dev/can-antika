import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RotateCcw, CheckCircle, XCircle, Clock, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SiteSettingsResponse } from "@/lib/types"

import { getServerApiUrl } from "@/lib/server-api-url"
const API_URL = getServerApiUrl()

async function fetchSiteSettings(): Promise<SiteSettingsResponse | null> {
  try {
    const res = await fetch(`${API_URL}/v1/site-settings`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: "İade Politikası | Can Antika - 14 Gün İade Hakkı",
  description:
    "Can Antika iade politikası. 14 gün içinde koşulsuz iade hakkı. Müşteri memnuniyeti garantisi ile güvenle alışveriş yapın.",
  keywords: ["antika iade", "can antika iade politikası", "antika değişim", "müşteri memnuniyeti"],
  openGraph: {
    title: "İade Politikası | Can Antika",
    description: "14 gün içinde koşulsuz iade hakkı. Müşteri memnuniyeti bizim için en önemli değerdir.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function ReturnsPage() {
  const s = await fetchSiteSettings()
  const phone = s?.phone || ""
  const email = s?.email || ""
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">İade Politikası</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Müşteri memnuniyeti bizim için en önemli değerdir.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          {/* Return Period */}
          <section className="mb-16">
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Clock className="h-12 w-12 shrink-0 text-accent" />
                  <div>
                    <h2 className="font-serif text-2xl font-semibold">14 Gün İade Hakkı</h2>
                    <p className="mt-2 text-muted-foreground">
                      Satın aldığınız ürünü, teslim tarihinden itibaren 14 gün içinde iade edebilirsiniz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Conditions */}
          <section className="mb-16">
            <h2 className="mb-8 font-serif text-2xl font-semibold">İade Koşulları</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif text-green-700">
                    <CheckCircle className="h-6 w-6" />
                    İade Edilebilir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      Orijinal ambalajında, hasarsız ürünler
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      Sertifika ve belgeleri eksiksiz ürünler
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      Kullanılmamış ve denenmemiş ürünler
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      Fatura ile birlikte iade edilen ürünler
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif text-red-700">
                    <XCircle className="h-6 w-6" />
                    İade Edilemez
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      Müşteri isteğiyle özel restore edilen ürünler
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      Hasar görmüş veya değiştirilmiş ürünler
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      14 günlük süreyi aşan iade talepleri
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      Özel sipariş veya müzayede ürünleri
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Process */}
          <section className="mb-16">
            <h2 className="mb-8 font-serif text-2xl font-semibold">İade Süreci</h2>
            <div className="space-y-6">
              {[
                { step: 1, title: "İletişime Geçin", desc: "Telefon veya e-posta ile iade talebinizi bildirin." },
                { step: 2, title: "Onay Alın", desc: "İade talebiniz incelenerek 24 saat içinde onaylanır." },
                { step: 3, title: "Ürünü Gönderin", desc: "Orijinal ambalajında, sigortalı kargo ile gönderin." },
                { step: 4, title: "İnceleme", desc: "Ürün tarafımıza ulaştığında uzmanlarımızca incelenir." },
                { step: 5, title: "Geri Ödeme", desc: "Onay sonrası 5 iş günü içinde ödemeniz iade edilir." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Refund */}
          <section className="mb-16">
            <h2 className="mb-6 font-serif text-2xl font-semibold">Geri Ödeme</h2>
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <RotateCcw className="h-8 w-8 shrink-0 text-accent" />
                  <div className="space-y-3 text-muted-foreground">
                    <p>İade onaylandıktan sonra, ödemeniz orijinal ödeme yönteminize 5 iş günü içinde iade edilir.</p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Kredi kartı ödemeleri: 5-10 iş günü (banka sürecine bağlı)</li>
                      <li>Havale/EFT ödemeleri: 3-5 iş günü</li>
                      <li>Kargo ücreti: Ürün kaynaklı iadelerde tarafımızca karşılanır</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <Phone className="h-8 w-8 shrink-0 text-accent" />
                  <div>
                    <p className="font-serif text-lg font-semibold">İade talebi oluşturmak için</p>
                    <p className="text-primary-foreground/80">
                      {phone && email
                        ? `${phone} veya ${email} adresinden bize ulaşın.`
                        : phone || email
                          ? `${phone || email} üzerinden bize ulaşın.`
                          : "İletişim sayfamızdan bize ulaşabilirsiniz."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
