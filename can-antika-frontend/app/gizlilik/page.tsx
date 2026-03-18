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
  title: "Gizlilik Politikası | Can Antika - KVKK Uyumlu",
  description:
    "Can Antika gizlilik politikası. 6698 sayılı KVKK kapsamında kişisel verilerinizin toplanması, işlenmesi, saklanması ve korunması hakkında detaylı bilgi.",
  keywords: ["gizlilik politikası", "kvkk", "kişisel veri koruma", "can antika gizlilik", "6698 kvkk"],
  openGraph: {
    title: "Gizlilik Politikası | Can Antika",
    description: "6698 sayılı KVKK kapsamında kişisel verilerinizin korunması hakkında detaylı bilgi.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function PrivacyPage() {
  const s = await fetchSiteSettings()
  const companyName = s?.companyName || "Mesut Can Bireysel Şirketi"
  const phone = s?.phone || ""
  const email = s?.email || ""
  const address = s?.address || ""
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Gizlilik Politikası</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">Son güncelleme: 17 Şubat 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          {/* Quick Nav */}
          <nav className="mb-12 rounded-lg border border-border bg-muted/50 p-6">
            <p className="font-serif text-lg font-semibold text-foreground mb-4">İçindekiler</p>
            <ol className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground list-decimal list-inside">
              <li><a href="#veri-sorumlusu" className="hover:text-primary transition-colors">Veri Sorumlusu</a></li>
              <li><a href="#toplanan-veriler" className="hover:text-primary transition-colors">Toplanan Kişisel Veriler</a></li>
              <li><a href="#isleme-amaci" className="hover:text-primary transition-colors">Verilerin İşlenme Amaçları</a></li>
              <li><a href="#hukuki-sebep" className="hover:text-primary transition-colors">Hukuki Sebepler</a></li>
              <li><a href="#paylasim" className="hover:text-primary transition-colors">Verilerin Paylaşımı ve Aktarımı</a></li>
              <li><a href="#saklama" className="hover:text-primary transition-colors">Saklama Süreleri</a></li>
              <li><a href="#guvenlik" className="hover:text-primary transition-colors">Veri Güvenliği</a></li>
              <li><a href="#haklariniz" className="hover:text-primary transition-colors">KVKK Kapsamındaki Haklarınız</a></li>
              <li><a href="#antika-ozel" className="hover:text-primary transition-colors">Antika Ticaretine Özel Veriler</a></li>
              <li><a href="#iletisim" className="hover:text-primary transition-colors">İletişim</a></li>
            </ol>
          </nav>

          <div className="prose prose-lg max-w-none space-y-12">
            {/* 1. Veri Sorumlusu */}
            <section id="veri-sorumlusu">
              <h2 className="font-serif text-2xl font-semibold text-foreground">1. Veri Sorumlusu</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz;
                veri sorumlusu sıfatıyla <strong className="text-foreground">Mesut Can Bireysel Şirketi</strong>
                tarafından aşağıda açıklanan kapsamda işlenmektedir.
              </p>
              <div className="mt-4 rounded-lg bg-muted p-6 space-y-2">
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Ticaret Unvanı:</strong> {companyName}</p>
                {address && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Adres:</strong> {address}</p>}
                {email && <p className="text-sm text-muted-foreground"><strong className="text-foreground">E-posta:</strong> {email}</p>}
                {phone && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Telefon:</strong> {phone}</p>}
              </div>
            </section>

            {/* 2. Toplanan Veriler */}
            <section id="toplanan-veriler">
              <h2 className="font-serif text-2xl font-semibold text-foreground">2. Toplanan Kişisel Veriler</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Hizmetlerimizi sunabilmek amacıyla aşağıdaki kategorilerdeki kişisel verilerinizi topluyoruz:
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    category: "Kimlik Bilgileri",
                    items: ["Ad, soyad", "T.C. kimlik numarası (fatura için)", "Doğum tarihi"],
                  },
                  {
                    category: "İletişim Bilgileri",
                    items: ["E-posta adresi", "Telefon numarası", "Teslimat ve fatura adresleri"],
                  },
                  {
                    category: "Finansal Bilgiler",
                    items: ["Kredi kartı bilgileri (şifreli)", "Banka hesap bilgileri (iade için)", "Fatura bilgileri"],
                  },
                  {
                    category: "İşlem Güvenliği",
                    items: ["Şifre (hash olarak)", "Oturum bilgileri", "IP adresi ve giriş logları"],
                  },
                  {
                    category: "Kullanım Verileri",
                    items: ["Sipariş geçmişi", "Favori/istek listesi", "Ürün değerlendirmeleri"],
                  },
                  {
                    category: "Teknik Veriler",
                    items: ["Tarayıcı türü ve sürümü", "Cihaz bilgileri", "Çerez verileri"],
                  },
                ].map((group) => (
                  <div key={group.category} className="rounded-lg border border-border p-4">
                    <h3 className="font-serif text-base font-semibold text-foreground">{group.category}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. İşleme Amaçları */}
            <section id="isleme-amaci">
              <h2 className="font-serif text-2xl font-semibold text-foreground">3. Verilerin İşlenme Amaçları</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, KVKK&apos;nın 5. ve 6. maddelerinde belirtilen şartlara uygun olarak
                aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <span>Üyelik kaydının oluşturulması ve yönetilmesi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <span>Siparişlerin işlenmesi, faturalandırılması ve teslimatın gerçekleştirilmesi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  <span>Antika eser orijinallik sertifikalarının düzenlenmesi ve sahiplik kaydı</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">4</span>
                  <span>2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu kapsamındaki yasal yükümlülüklerin yerine getirilmesi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">5</span>
                  <span>Müşteri destek taleplerinin yanıtlanması ve iletişim</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">6</span>
                  <span>İade ve değişim süreçlerinin yönetimi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">7</span>
                  <span>Yasal düzenlemeler kapsamında vergi, muhasebe ve denetim yükümlülüklerinin yerine getirilmesi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">8</span>
                  <span>Açık rızanızla, yeni koleksiyon ve kampanya bildirimlerinin gönderilmesi</span>
                </li>
              </ul>
            </section>

            {/* 4. Hukuki Sebep */}
            <section id="hukuki-sebep">
              <h2 className="font-serif text-2xl font-semibold text-foreground">4. Veri İşlemenin Hukuki Sebepleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, KVKK Madde 5/2 kapsamında aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:
              </p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    basis: "Sözleşmenin İfası",
                    desc: "Satış sözleşmesinin kurulması ve ifası; sipariş, teslimat, fatura, iade işlemlerinin yürütülmesi.",
                  },
                  {
                    basis: "Kanuni Yükümlülük",
                    desc: "6563 sayılı E-Ticaret Kanunu, 6502 sayılı TKHK, 213 sayılı VUK, 2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu kapsamındaki yasal yükümlülükler.",
                  },
                  {
                    basis: "Meşru Menfaat",
                    desc: "Hizmet kalitesinin artırılması, dolandırıcılık önleme, site güvenliğinin sağlanması.",
                  },
                  {
                    basis: "Açık Rıza",
                    desc: "Pazarlama iletişimleri, kişiselleştirilmiş öneriler ve analitik çerezler yalnızca açık rızanız ile işlenir.",
                  },
                ].map((item) => (
                  <div key={item.basis} className="rounded-lg border border-border p-4">
                    <h3 className="font-serif text-base font-semibold text-foreground">{item.basis}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Paylaşım */}
            <section id="paylasim">
              <h2 className="font-serif text-2xl font-semibold text-foreground">5. Verilerin Paylaşımı ve Aktarımı</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, KVKK Madde 8 ve 9 kapsamında aşağıdaki taraflarla ve belirtilen amaçlarla paylaşılabilir:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 pr-4 text-left font-serif font-semibold text-foreground">Alıcı Grubu</th>
                      <th className="py-3 text-left font-serif font-semibold text-foreground">Aktarım Amacı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-3 pr-4">Kargo ve lojistik firmaları</td><td className="py-3">Sigortalı teslimat, kargo takibi</td></tr>
                    <tr><td className="py-3 pr-4">Ödeme kuruluşları (bankalar, ödeme altyapıları)</td><td className="py-3">Güvenli ödeme işleme, 3D Secure doğrulama</td></tr>
                    <tr><td className="py-3 pr-4">Kültür ve Turizm Bakanlığı</td><td className="py-3">2863 sayılı Kanun gereği tescilli eser bildirimleri</td></tr>
                    <tr><td className="py-3 pr-4">Vergi daireleri ve mali müşavirler</td><td className="py-3">Yasal vergi yükümlülükleri, e-fatura</td></tr>
                    <tr><td className="py-3 pr-4">Yetkili kamu kurum ve kuruluşları</td><td className="py-3">Yasal zorunluluk halinde talep üzerine</td></tr>
                    <tr><td className="py-3 pr-4">E-posta hizmet sağlayıcıları</td><td className="py-3">Sipariş bildirimleri, destek yazışmaları</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 rounded-lg bg-accent/10 border border-accent/20 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Yurt Dışı Aktarım:</strong> Kişisel verileriniz, yeterli
                  koruma bulunan veya yazılı taahhütname ile yeterli korumanın sağlandığı ülkelere aktarılabilir
                  (KVKK Madde 9). Ödeme altyapı hizmetleri için AB ülkelerindeki sunucular kullanılmaktadır.
                </p>
              </div>
            </section>

            {/* 6. Saklama Süreleri */}
            <section id="saklama">
              <h2 className="font-serif text-2xl font-semibold text-foreground">6. Veri Saklama Süreleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve ilgili mevzuatın öngördüğü
                asgari süreler dahilinde saklanmaktadır:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 pr-4 text-left font-serif font-semibold text-foreground">Veri Kategorisi</th>
                      <th className="py-3 text-left font-serif font-semibold text-foreground">Saklama Süresi</th>
                      <th className="py-3 text-left font-serif font-semibold text-foreground">Dayanak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-3 pr-4">Üyelik bilgileri</td><td className="py-3">Üyelik süresince + 3 yıl</td><td className="py-3">6098 TBK</td></tr>
                    <tr><td className="py-3 pr-4">Sipariş ve fatura kayıtları</td><td className="py-3">10 yıl</td><td className="py-3">213 VUK, 6102 TTK</td></tr>
                    <tr><td className="py-3 pr-4">Mesafeli satış sözleşmeleri</td><td className="py-3">3 yıl</td><td className="py-3">Mesafeli Sözleşmeler Yönetmeliği</td></tr>
                    <tr><td className="py-3 pr-4">E-ticaret kayıtları</td><td className="py-3">3 yıl</td><td className="py-3">6563 E-Ticaret Kanunu</td></tr>
                    <tr><td className="py-3 pr-4">Antika eser sahiplik belgeleri</td><td className="py-3">Süresiz</td><td className="py-3">2863 Kültür Varlıkları Kanunu</td></tr>
                    <tr><td className="py-3 pr-4">İnternet erişim logları</td><td className="py-3">2 yıl</td><td className="py-3">5651 İnternet Kanunu</td></tr>
                    <tr><td className="py-3 pr-4">Pazarlama izinleri</td><td className="py-3">İzin geri alınana kadar</td><td className="py-3">6563 E-Ticaret, İYS</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Güvenlik */}
            <section id="guvenlik">
              <h2 className="font-serif text-2xl font-semibold text-foreground">7. Veri Güvenliği Tedbirleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                KVKK&apos;nın 12. maddesi gereğince, kişisel verilerinizin hukuka aykırı işlenmesini, erişilmesini
                önlemek ve muhafazasını sağlamak amacıyla aşağıdaki teknik ve idari tedbirler uygulanmaktadır:
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground">Teknik Tedbirler</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>256-bit SSL/TLS şifreleme</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Şifrelerin bcrypt ile hashlenmesi</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>PCI DSS uyumlu ödeme altyapısı</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Güvenlik duvarı ve saldırı tespit sistemleri</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Düzenli penetrasyon testleri</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Otomatik yedekleme ve felaket kurtarma</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-serif text-base font-semibold text-foreground">İdari Tedbirler</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Çalışan gizlilik sözleşmeleri</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Yetki matrisine dayalı erişim kontrolü</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Periyodik veri güvenliği eğitimleri</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Veri işleme envanteri ve politikaları</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Veri ihlali müdahale planı</li>
                    <li className="flex items-start gap-2"><span className="text-primary">•</span>Üçüncü taraf sözleşmeleri denetimi</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8. KVKK Hakları */}
            <section id="haklariniz">
              <h2 className="font-serif text-2xl font-semibold text-foreground">8. KVKK Madde 11 Kapsamındaki Haklarınız</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kanun&apos;un 11. maddesi uyarınca, veri sorumlusuna başvurarak aşağıdaki haklarınızı kullanabilirsiniz:
              </p>
              <ol className="mt-4 space-y-3 text-muted-foreground list-none">
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">a</span>
                  <span>Kişisel verilerinizin işlenip işlenmediğini <strong className="text-foreground">öğrenme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">b</span>
                  <span>İşlenmişse buna ilişkin <strong className="text-foreground">bilgi talep etme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">c</span>
                  <span>İşlenme <strong className="text-foreground">amacını</strong> ve amacına uygun kullanılıp kullanılmadığını öğrenme</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">ç</span>
                  <span>Yurt içinde veya yurt dışında aktarıldığı <strong className="text-foreground">üçüncü kişileri bilme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">d</span>
                  <span>Eksik veya yanlış işlenmişse <strong className="text-foreground">düzeltilmesini isteme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">e</span>
                  <span>KVKK Madde 7 şartları çerçevesinde <strong className="text-foreground">silinmesini veya yok edilmesini isteme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">f</span>
                  <span>Düzeltme/silme işlemlerinin aktarıldığı <strong className="text-foreground">üçüncü kişilere bildirilmesini isteme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">g</span>
                  <span>Otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç çıkmasına <strong className="text-foreground">itiraz etme</strong></span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">ğ</span>
                  <span>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde <strong className="text-foreground">zararın giderilmesini talep etme</strong></span>
                </li>
              </ol>
              <div className="mt-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Başvuru Yöntemi:</strong> Haklarınızı kullanmak için
                  <strong className="text-foreground"> kvkk@canantika.com</strong> adresine kimliğinizi tespit edici
                  belgeler ile birlikte yazılı başvuruda bulunabilirsiniz. Başvurunuz en geç <strong className="text-foreground">30 gün</strong> içinde
                  ücretsiz olarak sonuçlandırılacaktır. İşlemin ek maliyet gerektirmesi halinde Kurul tarafından
                  belirlenen tarife uygulanabilir.
                </p>
              </div>
            </section>

            {/* 9. Antika Özel */}
            <section id="antika-ozel">
              <h2 className="font-serif text-2xl font-semibold text-foreground">9. Antika Ticaretine Özel Veri İşleme</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Antika eser ticaretinin doğası gereği, aşağıdaki ek veri işleme faaliyetleri gerçekleştirilebilir:
              </p>
              <ul className="mt-4 list-inside list-disc space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Orijinallik Sertifikası:</strong> Satın aldığınız eserlere
                  ilişkin sahiplik ve orijinallik kayıtları, 2863 sayılı Kanun gereğince ilgili kamu kurumlarıyla paylaşılabilir.
                </li>
                <li>
                  <strong className="text-foreground">Eser Geçmişi (Provenans):</strong> Alıcı-satıcı kimlik
                  bilgileri, eserin provenans zincirinin belgelenmesi amacıyla süresiz saklanabilir.
                </li>
                <li>
                  <strong className="text-foreground">Restorasyon Kayıtları:</strong> Müşteri talebiyle yapılan
                  restorasyon işlemlerinde tercih ve iletişim bilgileri saklanır.
                </li>
                <li>
                  <strong className="text-foreground">Uzman Değerlendirme:</strong> Eser değerlendirme hizmeti
                  talep etmeniz halinde, esere ilişkin fotoğraf ve açıklamalar uzman ekibimizle paylaşılır.
                </li>
                <li>
                  <strong className="text-foreground">Sigorta:</strong> Yüksek değerli eserlerin sigortalanması
                  için gerekli minimum bilgiler sigorta şirketleriyle paylaşılabilir.
                </li>
              </ul>
            </section>

            {/* 10. İletişim */}
            <section id="iletisim">
              <h2 className="font-serif text-2xl font-semibold text-foreground">10. İletişim</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Gizlilik politikamız veya kişisel verilerinizle ilgili her türlü soru, talep ve şikayetleriniz için:
              </p>
              <div className="mt-4 rounded-lg bg-muted p-6">
                <p className="font-serif font-semibold text-foreground">{companyName}</p>
                <p className="mt-2 text-muted-foreground">Veri Sorumlusu İrtibat: kvkk@canantika.com</p>
                {email && <p className="text-muted-foreground">Genel İletişim: {email}</p>}
                {phone && <p className="text-muted-foreground">Telefon: {phone}</p>}
                {address && <p className="text-muted-foreground">Adres: {address}</p>}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Kişisel Verileri Koruma Kurulu&apos;na şikayette bulunma hakkınız saklıdır.
                Detaylı bilgi için:{" "}
                <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.kvkk.gov.tr
                </a>
              </p>
            </section>

            {/* İlgili Sayfalar */}
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <p className="font-serif font-semibold text-foreground mb-3">İlgili Hukuki Metinler</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/kvkk" className="text-sm text-primary hover:underline">KVKK Aydınlatma Metni →</Link>
                <Link href="/mesafeli-satis-sozlesmesi" className="text-sm text-primary hover:underline">Mesafeli Satış Sözleşmesi →</Link>
                <Link href="/kullanim-kosullari" className="text-sm text-primary hover:underline">Kullanım Koşulları →</Link>
                <Link href="/cerezler" className="text-sm text-primary hover:underline">Çerez Politikası →</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
