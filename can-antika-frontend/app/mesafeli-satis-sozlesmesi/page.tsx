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
    title: "Mesafeli Satış Sözleşmesi | Can Antika",
    description:
        "Can Antika mesafeli satış sözleşmesi. 6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği kapsamında antika eser satışına ilişkin şartlar ve koşullar.",
    keywords: ["mesafeli satış sözleşmesi", "antika satış sözleşmesi", "6502 TKHK", "cayma hakkı"],
    openGraph: {
        title: "Mesafeli Satış Sözleşmesi | Can Antika",
        description: "Antika eser mesafeli satış sözleşmesi ön bilgilendirme formu.",
        type: "website",
        locale: "tr_TR",
    },
}

export default async function DistanceSalesPage() {
    const s = await fetchSiteSettings()
    const companyName = s?.companyName || "Mesut Can Bireysel Şirketi"
    const phone = s?.phone || ""
    const email = s?.email || ""
    const address = s?.address || ""
    const website = s?.website || "www.canantika.com"
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero */}
                <section className="bg-primary py-20 text-primary-foreground">
                    <div className="mx-auto max-w-4xl px-4 text-center">
                        <h1 className="font-serif text-4xl font-bold md:text-5xl">Mesafeli Satış Sözleşmesi</h1>
                        <p className="mt-4 text-lg text-primary-foreground/80">
                            6502 Sayılı Tüketicinin Korunması Hakkında Kanun Kapsamında
                        </p>
                        <p className="mt-2 text-sm text-primary-foreground/60">Son güncelleme: 17 Şubat 2026</p>
                    </div>
                </section>

                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="prose prose-lg max-w-none space-y-12">

                        {/* Madde 1 — Taraflar */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 1 — Taraflar</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-border p-5">
                                    <h3 className="font-serif text-base font-semibold text-foreground mb-3">SATICI</h3>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p><strong className="text-foreground">Unvan:</strong> {companyName}</p>
                                        {address && <p><strong className="text-foreground">Adres:</strong> {address}</p>}
                                        {phone && <p><strong className="text-foreground">Telefon:</strong> {phone}</p>}
                                        {email && <p><strong className="text-foreground">E-posta:</strong> {email}</p>}
                                        <p><strong className="text-foreground">Web:</strong> {website}</p>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border p-5">
                                    <h3 className="font-serif text-base font-semibold text-foreground mb-3">ALICI (TÜKETİCİ)</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Sipariş sırasında sisteme girilen ad-soyad, adres, telefon ve e-posta bilgileri alıcı bilgilerini oluşturur.
                                        Alıcı, sipariş onayı ile bu sözleşmeyi kabul etmiş sayılır.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Madde 2 — Konu */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 2 — Sözleşmenin Konusu</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                İşbu sözleşmenin konusu, ALICI&apos;nın SATICI&apos;ya ait <strong className="text-foreground">www.canantika.com</strong> internet
                                sitesinden elektronik ortamda siparişini verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen
                                antika eser/ürünün satışı ve teslimatına ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında
                                Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin
                                belirlenmesidir.
                            </p>
                            <div className="mt-4 rounded-lg bg-accent/10 border border-accent/20 p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Önemli Not:</strong> Sitemizdeki tüm antika ürünler tek ve
                                    özgün parçalardır. Her ürünün kendine has tarihi, kültürel ve sanatsal değeri bulunmaktadır.
                                    Satılan bir ürünün aynısının tekrar satışa sunulması mümkün değildir.
                                </p>
                            </div>
                        </section>

                        {/* Madde 3 — Ürün Bilgileri */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 3 — Ürün Bilgileri</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Sözleşme konusu antika ürünün temel nitelikleri (türü, adı, dönemi, kondisyon durumu, boyutları),
                                satış fiyatı (tüm vergiler dahil) ve ödeme bilgileri sipariş sayfasında ve sipariş onay e-postasında
                                belirtilmektedir. Antika eserlerin nitelikleri:
                            </p>
                            <ul className="mt-4 space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Her eser, uzman ekibimiz tarafından orijinallik ve kondisyon açısından değerlendirilmiştir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Ürün sayfasındaki fotoğraflar, eserin gerçek görselleridir. Ekran ayarlarına bağlı renk farklılıkları olabilir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Antika eserlerin doğası gereği, yaşına uygun doğal aşınma ve patina; kusur değil, otantiklik göstergesidir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Kondisyon raporu ve varsa restorasyon geçmişi ürün detay sayfasında belirtilir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Talep halinde orijinallik sertifikası düzenlenmektedir.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Madde 4 — Fiyat ve Ödeme */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 4 — Fiyat ve Ödeme</h2>
                            <ul className="mt-4 space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">4.1</span>
                                    <span>Ürün fiyatları Türk Lirası (₺) cinsinden olup, tüm vergiler (KDV) dahildir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">4.2</span>
                                    <span>
                                        Ödeme yöntemleri: Kredi kartı (Visa, Mastercard), havale/EFT ve kapıda ödeme seçenekleri sunulmaktadır.
                                        Kredi kartı bilgileri 256-bit SSL şifreleme ile korunur ve 3D Secure ile doğrulanır.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">4.3</span>
                                    <span>Sipariş tutarına bağlı olarak taksit seçenekleri sunulabilir. Taksitli satışlarda toplam tutar sipariş özetinde gösterilir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">4.4</span>
                                    <span>Kargo ücreti: 500₺ üzeri siparişlerde ücretsiz standart teslimat. 500₺ altı siparişlerde 75₺ kargo bedeli uygulanır.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">4.5</span>
                                    <span>
                                        ALICI, siparişi onayladığı takdirde ödeme yükümlülüğü altına girdiğini kabul ve beyan eder.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Madde 5 — Teslimat */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 5 — Teslimat</h2>
                            <ul className="mt-4 space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">5.1</span>
                                    <span>Ürünler, ALICI&apos;nın sipariş formunda belirttiği adrese teslim edilir.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">5.2</span>
                                    <span>
                                        Teslimat süresi sipariş onayından itibaren en geç <strong className="text-foreground">30 gün</strong>dür.
                                        Standart teslimat 3-5 iş günü, hızlı teslimat 1-2 iş günüdür.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">5.3</span>
                                    <span>
                                        Tüm antika eserler, profesyonel paketleme teknikleriyle (asitsiz koruyucu kâğıt, özel köpük
                                        kalıplar, çift cidarlı kutular) ve tam değer üzerinden sigortalı olarak gönderilir.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">5.4</span>
                                    <span>
                                        ALICI, teslimat sırasında ürünü kontrol etmeli; dış ambalajda hasar varsa kargo görevlisine
                                        tutanak tutturmalıdır. Tutanaksız teslim alınan ürünlerde kargoya ilişkin hasar iddiası kabul edilmez.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">5.5</span>
                                    <span>Mağazadan teslim alma seçeneği mevcuttur{address ? ` (${address})` : ""}.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Madde 6 — Cayma Hakkı */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 6 — Cayma Hakkı</h2>
                            <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
                                <p className="text-muted-foreground leading-relaxed">
                                    ALICI, sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim
                                    tarihinden itibaren <strong className="text-foreground">14 (on dört) gün</strong> içinde,
                                    herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
                                </p>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="font-serif text-base font-semibold text-foreground">Cayma Hakkının Kullanılması</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span>Cayma bildirimi, <strong className="text-foreground">{email || "destek@canantika.com"}</strong> adresine{phone && ` veya ${phone} numaralı hattımıza`} yapılabilir.</li>
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span>Cayma bildiriminin 14 günlük süre içinde SATICI&apos;ya yöneltilmiş olması yeterlidir.</li>
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span>ALICI, ürünü cayma tarihinden itibaren 10 gün içinde SATICI&apos;ya iade etmekle yükümlüdür.</li>
                                        <li className="flex items-start gap-2"><span className="text-primary">•</span>İade kargo bedeli ALICI&apos;ya aittir; ancak ürün ayıplı ise kargo bedeli SATICI tarafından karşılanır.</li>
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="font-serif text-base font-semibold text-foreground text-red-700">Cayma Hakkının Kullanılamayacağı Haller</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Mesafeli Sözleşmeler Yönetmeliği Madde 15 uyarınca aşağıdaki hallerde cayma hakkı kullanılamaz:
                                    </p>
                                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2"><span className="text-red-500">✕</span>ALICI&apos;nın isteğine veya kişisel ihtiyaçlarına göre özel olarak restore edilmiş veya hazırlanmış eserler</li>
                                        <li className="flex items-start gap-2"><span className="text-red-500">✕</span>Teslimden sonra ambalajı açılmış, bozulmuş veya iade edilemeyecek duruma getirilmiş ürünler</li>
                                        <li className="flex items-start gap-2"><span className="text-red-500">✕</span>Niteliği itibariyle iadesi uygun olmayan, hızla bozulma veya son kullanma tarihi geçme ihtimali olan ürünler</li>
                                        <li className="flex items-start gap-2"><span className="text-red-500">✕</span>Özel sipariş üzerine gerçekleştirilen müzayede satışları</li>
                                    </ul>
                                </div>
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="font-serif text-base font-semibold text-foreground">İade Koşulları (Antika Eserler İçin)</h3>
                                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2"><span className="text-green-600">✓</span>Ürün, orijinal ambalajı ve tüm aksesuarlarıyla birlikte iade edilmelidir</li>
                                        <li className="flex items-start gap-2"><span className="text-green-600">✓</span>Orijinallik sertifikası ve kondisyon raporu eksiksiz iade edilmelidir</li>
                                        <li className="flex items-start gap-2"><span className="text-green-600">✓</span>Ürün, teslim alındığı durumdaki kondisyonunu korumalıdır</li>
                                        <li className="flex items-start gap-2"><span className="text-green-600">✓</span>Fatura aslı veya kopyası iade ile birlikte gönderilmelidir</li>
                                        <li className="flex items-start gap-2"><span className="text-green-600">✓</span>Sigortalı kargo ile gönderilmelidir</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Madde 7 — Geri Ödeme */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 7 — Geri Ödeme</h2>
                            <ul className="mt-4 space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">7.1</span>
                                    <span>
                                        SATICI, cayma bildiriminin kendisine ulaştığı tarihten itibaren en geç
                                        <strong className="text-foreground"> 14 gün</strong> içinde toplam tutarı ALICI&apos;ya iade eder.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">7.2</span>
                                    <span>
                                        Geri ödeme, ALICI&apos;nın kullandığı ödeme aracına uygun olarak yapılır:
                                        kredi kartı ödemeleri ilgili banka aracılığıyla (5-10 iş günü), havale/EFT ödemeleri
                                        doğrudan banka hesabına (3-5 iş günü) iade edilir.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">7.3</span>
                                    <span>
                                        SATICI, ürünün ALICI tarafından geri gönderilmiş olduğunun kanıtlanmasına kadar geri
                                        ödemeyi askıya alma hakkına sahiptir.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Madde 8 — Garanti */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 8 — Orijinallik Garantisi</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Can Antika, satışa sunduğu tüm antika eserlerin orijinalliğini garanti eder. Satın aldığınız
                                bir eserin orijinal olmadığının bağımsız bir uzman tarafından tespit edilmesi halinde, satış
                                fiyatının tamamı iade edilir. Bu garanti süresiz olup, eserin sahipliği boyunca geçerlidir.
                            </p>
                            <div className="mt-4 rounded-lg bg-accent/10 border border-accent/20 p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">2863 Sayılı Kanun Uyarınca:</strong> Tescilli kültür
                                    varlığı niteliğindeki eserler, Kültür ve Turizm Bakanlığı&apos;ndan alınmış ruhsatname
                                    kapsamında satışa sunulmaktadır. Bu tür eserlerin yurt dışına çıkarılması yasaktır.
                                </p>
                            </div>
                        </section>

                        {/* Madde 9 — Ayıplı Ürün */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 9 — Ayıplı Ürün</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Tüketicinin Korunması Hakkında Kanun&apos;un 8-12. maddeleri uyarınca, ayıplı ürün teslimi halinde
                                ALICI şu haklara sahiptir:
                            </p>
                            <ul className="mt-4 space-y-2 text-muted-foreground">
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">→</span>Sözleşmeden dönme (tam iade)</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">→</span>Satış bedelinden indirim isteme</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">→</span>Ücretsiz onarım isteme (restorasyon)</li>
                                <li className="flex items-start gap-2"><span className="text-primary font-bold">→</span>Varsa ayıpsız misliyle değişim</li>
                            </ul>
                            <p className="mt-4 text-sm text-muted-foreground">
                                <strong className="text-foreground">Not:</strong> Antika eserlerde yaşa bağlı olağan aşınma,
                                patina, renk değişimi ve küçük kullanım izleri ayıp kapsamında değerlendirilmez.
                                Bu özellikler, eserin gerçek yaşının ve otantikliğinin kanıtıdır.
                            </p>
                        </section>

                        {/* Madde 10 — Uyuşmazlık */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 10 — Uyuşmazlık Çözümü</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır. Uyuşmazlıklarda;
                            </p>
                            <ul className="mt-4 space-y-2 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold">•</span>
                                    <span>
                                        Ticaret Bakanlığı tarafından ilan edilen değere kadar olan uyuşmazlıklarda <strong className="text-foreground">Tüketici Hakem Heyetleri</strong>,
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold">•</span>
                                    <span>
                                        Bu değeri aşan uyuşmazlıklarda <strong className="text-foreground">Tüketici Mahkemeleri</strong> yetkilidir.
                                    </span>
                                </li>
                            </ul>
                            <p className="mt-4 text-sm text-muted-foreground">
                                ALICI, şikâyet ve itirazlarını T.C. Ticaret Bakanlığı Tüketici Şikâyet Hattı (ALO 175) veya
                                e-Devlet üzerinden Tüketici Bilgi Sistemi (TÜBİS) aracılığıyla da iletebilir.
                            </p>
                        </section>

                        {/* Madde 11 — Kayıt Saklama */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 11 — Kayıt Saklama</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Mesafeli Sözleşmeler Yönetmeliği gereğince, SATICI bu sözleşmeyi, ön bilgilendirme formunu ve
                                cayma hakkı bildirimini <strong className="text-foreground">3 yıl</strong> süreyle saklamakla yükümlüdür.
                            </p>
                        </section>

                        {/* Madde 12 — Yürürlük */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Madde 12 — Yürürlük</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                İşbu sözleşme, ALICI tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.
                                ALICI, sipariş onayı vererek işbu sözleşmenin tüm koşullarını kabul etmiş sayılır.
                            </p>
                        </section>

                        {/* İlgili Sayfalar */}
                        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
                            <p className="font-serif font-semibold text-foreground mb-3">İlgili Hukuki Metinler</p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/gizlilik" className="text-sm text-primary hover:underline">Gizlilik Politikası →</Link>
                                <Link href="/kvkk" className="text-sm text-primary hover:underline">KVKK Aydınlatma Metni →</Link>
                                <Link href="/kullanim-kosullari" className="text-sm text-primary hover:underline">Kullanım Koşulları →</Link>
                                <Link href="/iade" className="text-sm text-primary hover:underline">İade Politikası →</Link>
                                <Link href="/teslimat" className="text-sm text-primary hover:underline">Teslimat Bilgileri →</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
