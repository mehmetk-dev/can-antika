import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Truck, Package, Clock, MapPin, Shield, Phone } from "lucide-react"
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
  title: "Teslimat Bilgileri | Can Antika - Güvenli Antika Teslimatı",
  description: "Can Antika teslimat bilgileri. Antikalarınız özenle paketlenir ve sigortalı olarak kapınıza ulaştırılır. Türkiye geneli teslimat.",
  keywords: ["antika teslimat", "antika kargo", "sigortalı antika gönderim", "antika paketleme"],
  openGraph: {
    title: "Teslimat Bilgileri | Can Antika",
    description: "Değerli antikalarınızı özenle paketliyor, güvenle kapınıza ulaştırıyoruz.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function ShippingPage() {
  const s = await fetchSiteSettings()

  const standardDelivery = s?.standardDelivery || "3-5 iş günü"
  const expressDelivery = s?.expressDelivery || "1-2 iş günü"
  const freeShippingMin = s?.freeShippingMin ?? 500
  const expressShippingFee = s?.expressShippingFee ?? 150
  const shippingDays = s?.shippingDurationDays ?? 5
  const phone = s?.phone || "+90 212 555 0123"
  const currencySymbol = s?.currencySymbol || "₺"

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Teslimat Bilgileri</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Değerli antikalarınızı özenle paketliyor, güvenle kapınıza ulaştırıyoruz.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          {/* Delivery Options */}
          <section className="mb-16">
            <h2 className="mb-8 font-serif text-2xl font-semibold">Teslimat Seçenekleri</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif">
                    <Truck className="h-6 w-6 text-accent" />
                    Standart Teslimat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Süre:</strong> {standardDelivery} ({shippingDays} iş günü)
                  </p>
                  <p>
                    <strong className="text-foreground">Ücret:</strong> {freeShippingMin}{currencySymbol} üzeri siparişlerde ücretsiz
                  </p>
                  <p>
                    <strong className="text-foreground">{freeShippingMin}{currencySymbol} altı:</strong> Kargo ücreti uygulanır
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif">
                    <Clock className="h-6 w-6 text-accent" />
                    Hızlı Teslimat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Süre:</strong> {expressDelivery}
                  </p>
                  <p>
                    <strong className="text-foreground">Ücret:</strong> {expressShippingFee}{currencySymbol}
                  </p>
                  <p>
                    <strong className="text-foreground">İstanbul içi:</strong> Aynı gün teslimat mümkün
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Packaging */}
          <section className="mb-16">
            <h2 className="mb-6 font-serif text-2xl font-semibold">Özel Paketleme</h2>
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Package className="h-8 w-8 shrink-0 text-accent" />
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Her antika eser, değerine ve kırılganlığına göre özel olarak paketlenir. Uzman ekibimiz, yüzyıllık
                      eserlerin güvenli taşınması için profesyonel paketleme teknikleri kullanır.
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Asit içermeyen koruyucu kağıtlar</li>
                      <li>Özel köpük kalıplar ve hava yastıkları</li>
                      <li>Çift cidarlı mukavva kutular</li>
                      <li>Büyük mobilyalar için ahşap sandıklar</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Delivery Areas */}
          <section className="mb-16">
            <h2 className="mb-6 font-serif text-2xl font-semibold">Teslimat Bölgeleri</h2>
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 shrink-0 text-accent" />
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Türkiye Geneli:</strong> Tüm illere teslimat yapılmaktadır.
                    </p>
                    <p>
                      <strong className="text-foreground">İstanbul:</strong> Özel kurye ile aynı gün teslimat seçeneği mevcuttur.
                    </p>
                    <p>
                      <strong className="text-foreground">Mağazadan Teslim:</strong> Mağazamızdan ücretsiz teslim alabilirsiniz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Insurance */}
          <section className="mb-16">
            <h2 className="mb-6 font-serif text-2xl font-semibold">Sigorta ve Güvence</h2>
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-8 w-8 shrink-0 text-accent" />
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Tüm gönderilerimiz, eserin tam değeri üzerinden sigortalıdır. Nakliye sırasında oluşabilecek her
                      türlü hasar, tarafımızca karşılanır.
                    </p>
                    <p className="font-medium text-foreground">
                      Teslimat anında eseri kontrol etmenizi ve herhangi bir hasar durumunda tutanak tutmanızı rica ederiz.
                    </p>
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
                    <p className="font-serif text-lg font-semibold">Teslimat ile ilgili sorularınız mı var?</p>
                    <p className="text-primary-foreground/80">
                      {phone} numaralı hattımızdan bize ulaşabilirsiniz.
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
