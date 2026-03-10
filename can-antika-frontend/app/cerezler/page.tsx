import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
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
  title: "Çerez Politikası | Can Antika",
  description:
    "Can Antika çerez politikası. Hangi çerezlerin kullanıldığını, amaçlarını, sürelerini ve nasıl yönetebileceğinizi detaylıca öğrenin.",
  keywords: ["çerez politikası", "cookies", "çerez ayarları", "can antika çerezler", "kvkk çerez"],
  openGraph: {
    title: "Çerez Politikası | Can Antika",
    description: "Çerez kullanımımız hakkında detaylı bilgi.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function CookiesPage() {
  const s = await fetchSiteSettings()
  const companyName = s?.companyName || "Can Antika Ticaret Ltd. Şti."
  const phone = s?.phone || ""
  const email = s?.email || ""
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Çerez Politikası</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">Son güncelleme: 17 Şubat 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="prose prose-lg max-w-none space-y-12">
            {/* Çerez Nedir */}
            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Çerez (Cookie) Nedir?</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza (bilgisayar,
                tablet, akıllı telefon) yerleştirilen küçük metin dosyalarıdır. Bu dosyalar, sizi tanımak,
                tercihlerinizi hatırlamak ve size daha iyi bir kullanıcı deneyimi sunmak amacıyla kullanılır.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                6698 sayılı KVKK ve 5809 sayılı Elektronik Haberleşme Kanunu kapsamında, zorunlu çerezler
                dışındaki çerezler yalnızca açık onayınızla yerleştirilmektedir.
              </p>
            </section>

            {/* Çerez Türleri — Detaylı Tablo */}
            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Kullandığımız Çerez Türleri</h2>

              <div className="mt-6 space-y-6">
                {/* Zorunlu */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-primary/10 px-5 py-3 border-b border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">✓</span>
                      Zorunlu (Kesinlikle Gerekli) Çerezler
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">Bu çerezler olmadan site düzgün çalışmaz. Onay gerektirmez.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-5 py-2 font-semibold text-foreground">Çerez Adı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Amacı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Süre</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        <tr><td className="px-5 py-2">session_id</td><td className="px-5 py-2">Oturum yönetimi ve kimlik doğrulama</td><td className="px-5 py-2">Oturum</td></tr>
                        <tr><td className="px-5 py-2">csrf_token</td><td className="px-5 py-2">Siteler arası istek sahteciliği koruması</td><td className="px-5 py-2">Oturum</td></tr>
                        <tr><td className="px-5 py-2">cart_items</td><td className="px-5 py-2">Sepet içeriğinin korunması</td><td className="px-5 py-2">7 gün</td></tr>
                        <tr><td className="px-5 py-2">cookie_consent</td><td className="px-5 py-2">Çerez tercihlerinizin saklanması</td><td className="px-5 py-2">1 yıl</td></tr>
                        <tr><td className="px-5 py-2">locale</td><td className="px-5 py-2">Dil ve bölge tercihi</td><td className="px-5 py-2">1 yıl</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performans */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">📊</span>
                      Performans ve Analitik Çerezler
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">Site kullanım istatistikleri için. Açık rıza ile yerleştirilir.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-5 py-2 font-semibold text-foreground">Çerez Adı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Amacı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Süre</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Sağlayıcı</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        <tr><td className="px-5 py-2">_ga</td><td className="px-5 py-2">Tekil ziyaretçi kimliği</td><td className="px-5 py-2">2 yıl</td><td className="px-5 py-2">Google Analytics</td></tr>
                        <tr><td className="px-5 py-2">_ga_*</td><td className="px-5 py-2">Oturum durumu takibi</td><td className="px-5 py-2">2 yıl</td><td className="px-5 py-2">Google Analytics</td></tr>
                        <tr><td className="px-5 py-2">_gid</td><td className="px-5 py-2">24 saatlik ziyaretçi ayrımı</td><td className="px-5 py-2">24 saat</td><td className="px-5 py-2">Google Analytics</td></tr>
                        <tr><td className="px-5 py-2">_gat</td><td className="px-5 py-2">İstek hızı sınırlama</td><td className="px-5 py-2">1 dakika</td><td className="px-5 py-2">Google Analytics</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* İşlevsellik */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-purple-50 dark:bg-purple-950/30 px-5 py-3 border-b border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs text-white">⚙</span>
                      İşlevsellik Çerezleri
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">Deneyiminizi kişiselleştirmek için. Açık rıza ile yerleştirilir.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-5 py-2 font-semibold text-foreground">Çerez Adı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Amacı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Süre</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        <tr><td className="px-5 py-2">recently_viewed</td><td className="px-5 py-2">Son görüntülenen antika eserlerin listesi</td><td className="px-5 py-2">30 gün</td></tr>
                        <tr><td className="px-5 py-2">wishlist</td><td className="px-5 py-2">Favori ürünler listesi (misafir kullanıcı)</td><td className="px-5 py-2">90 gün</td></tr>
                        <tr><td className="px-5 py-2">preferred_category</td><td className="px-5 py-2">Tercih edilen antika kategorileri</td><td className="px-5 py-2">1 yıl</td></tr>
                        <tr><td className="px-5 py-2">theme</td><td className="px-5 py-2">Açık/koyu tema tercihi</td><td className="px-5 py-2">1 yıl</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pazarlama */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-orange-50 dark:bg-orange-950/30 px-5 py-3 border-b border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs text-white">📢</span>
                      Pazarlama ve Hedefleme Çerezleri
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">Reklam kişiselleştirme için. Açık rıza ile yerleştirilir.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-5 py-2 font-semibold text-foreground">Çerez Adı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Amacı</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Süre</th>
                        <th className="px-5 py-2 font-semibold text-foreground">Sağlayıcı</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        <tr><td className="px-5 py-2">_fbp</td><td className="px-5 py-2">Facebook reklam optimizasyonu</td><td className="px-5 py-2">3 ay</td><td className="px-5 py-2">Meta (Facebook)</td></tr>
                        <tr><td className="px-5 py-2">_fbc</td><td className="px-5 py-2">Facebook tıklama takibi</td><td className="px-5 py-2">2 yıl</td><td className="px-5 py-2">Meta (Facebook)</td></tr>
                        <tr><td className="px-5 py-2">IDE</td><td className="px-5 py-2">Google Ads reklam kişiselleştirme</td><td className="px-5 py-2">13 ay</td><td className="px-5 py-2">Google</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Çerez Yönetimi */}
            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Çerezleri Nasıl Yönetebilirsiniz?</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Çerez tercihlerinizi aşağıdaki yöntemlerle kontrol edebilirsiniz:
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground">1. Site İçi Çerez Yönetimi</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sitemizi ilk ziyaretinizde görüntülenen çerez onay banneri üzerinden tercihlerinizi
                    belirleyebilirsiniz. Dilediğiniz zaman sayfanın alt kısmındaki &quot;Çerez Ayarları&quot;
                    bağlantısından tercihlerinizi güncelleyebilirsiniz.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground">2. Tarayıcı Ayarları</h3>
                  <p className="mt-2 text-sm text-muted-foreground mb-3">
                    Tüm modern tarayıcılar, çerez ayarlarını değiştirmenize olanak tanır:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { browser: "Google Chrome", path: "Ayarlar → Gizlilik ve Güvenlik → Üçüncü Taraf Çerezleri" },
                      { browser: "Mozilla Firefox", path: "Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri" },
                      { browser: "Apple Safari", path: "Tercihler → Gizlilik → Çerezler ve Web Sitesi Verileri" },
                      { browser: "Microsoft Edge", path: "Ayarlar → Çerezler ve Site İzinleri → Çerezler" },
                    ].map((item) => (
                      <div key={item.browser} className="rounded bg-muted/50 p-3">
                        <p className="font-semibold text-foreground text-sm">{item.browser}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.path}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground">3. Üçüncü Taraf Çerez Yönetimi</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>
                      <strong className="text-foreground">Google Analytics:</strong>{" "}
                      <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Google Analytics Opt-out Browser Add-on
                      </a>
                    </li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>
                      <strong className="text-foreground">Facebook:</strong>{" "}
                      <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Facebook Reklam Tercihleri
                      </a>
                    </li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>
                      <strong className="text-foreground">Google Ads:</strong>{" "}
                      <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Google Reklam Ayarları
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-accent/10 border border-accent/20 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Uyarı:</strong> Zorunlu çerezleri devre dışı bırakmak,
                  oturum yönetimi, sepet işlevleri ve ödeme sistemlerinin çalışmamasına neden olabilir.
                  Performans ve pazarlama çerezlerini devre dışı bırakmak, sitenin temel işlevlerini etkilemez
                  ancak kişiselleştirilmiş deneyim sunulmasını engeller.
                </p>
              </div>
            </section>

            {/* Değişiklikler */}
            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">Politika Değişiklikleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu çerez politikasını, yasal gereklilikler veya teknolojik gelişmeler doğrultusunda
                güncelleme hakkımız saklıdır. Önemli değişiklikler olması durumunda sitemiz üzerinden
                bildirimde bulunulacaktır.
              </p>
            </section>

            {/* İletişim */}
            <section>
              <h2 className="font-serif text-2xl font-semibold text-foreground">İletişim</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Çerez politikamız hakkında sorularınız için:
              </p>
              <div className="mt-4 rounded-lg bg-muted p-6">
                <p className="font-serif font-semibold text-foreground">{companyName}</p>
                {email && <p className="mt-2 text-muted-foreground">E-posta: {email}</p>}
                <p className="text-muted-foreground">KVKK İletişim: kvkk@canantika.com</p>
                {phone && <p className="text-muted-foreground">Telefon: {phone}</p>}
              </div>
            </section>

            {/* İlgili Sayfalar */}
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <p className="font-serif font-semibold text-foreground mb-3">İlgili Hukuki Metinler</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/gizlilik" className="text-sm text-primary hover:underline">Gizlilik Politikası →</Link>
                <Link href="/kvkk" className="text-sm text-primary hover:underline">KVKK Aydınlatma Metni →</Link>
                <Link href="/mesafeli-satis-sozlesmesi" className="text-sm text-primary hover:underline">Mesafeli Satış Sözleşmesi →</Link>
                <Link href="/kullanim-kosullari" className="text-sm text-primary hover:underline">Kullanım Koşulları →</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
