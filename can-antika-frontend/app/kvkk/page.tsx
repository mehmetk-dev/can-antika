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
    title: "KVKK Aydınlatma Metni | Can Antika",
    description:
        "Can Antika KVKK Aydınlatma Metni. 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sahiplerinin aydınlatılmasına ilişkin bilgilendirme.",
    keywords: ["kvkk aydınlatma metni", "6698 kvkk", "kişisel veri aydınlatma", "can antika kvkk"],
    openGraph: {
        title: "KVKK Aydınlatma Metni | Can Antika",
        description: "6698 sayılı KVKK kapsamında aydınlatma yükümlülüğümüz.",
        type: "website",
        locale: "tr_TR",
    },
}

export default async function KVKKPage() {
    const s = await fetchSiteSettings()
    const companyName = s?.companyName || "Can Antika Ticaret Ltd. Şti."
    const address = s?.address || ""
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero */}
                <section className="bg-primary py-20 text-primary-foreground">
                    <div className="mx-auto max-w-4xl px-4 text-center">
                        <h1 className="font-serif text-4xl font-bold md:text-5xl">KVKK Aydınlatma Metni</h1>
                        <p className="mt-4 text-lg text-primary-foreground/80">
                            6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında
                        </p>
                        <p className="mt-2 text-sm text-primary-foreground/60">Son güncelleme: 17 Şubat 2026</p>
                    </div>
                </section>

                <div className="mx-auto max-w-4xl px-4 py-16">
                    <div className="prose prose-lg max-w-none space-y-12">
                        {/* Başlangıç */}
                        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">Can Antika Ticaret Ltd. Şti.</strong> olarak kişisel verilerinizin
                                güvenliği konusunda büyük hassasiyet göstermekteyiz. Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin
                                Korunması Kanunu&apos;nun (&quot;KVKK&quot;) 10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde
                                Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında hazırlanmıştır.
                            </p>
                        </div>

                        {/* Veri Sorumlusu */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Veri Sorumlusunun Kimliği</h2>
                            <div className="mt-4 rounded-lg bg-muted p-6 space-y-2">
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Veri Sorumlusu:</strong> {companyName}</p>
                                {address && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Adres:</strong> {address}</p>}
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">E-posta:</strong> kvkk@canantika.com</p>
                                <p className="text-sm text-muted-foreground"><strong className="text-foreground">İrtibat Kişisi:</strong> Can Antika Veri Koruma Sorumlusu</p>
                            </div>
                        </section>

                        {/* İşlenen Veriler ve Amaçlar */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">İşlenen Kişisel Veriler, Amaçları ve Hukuki Sebepleri</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Aşağıdaki tabloda kişisel verilerinizin hangi amaçlarla ve hangi hukuki sebeplere dayalı olarak
                                işlendiği belirtilmiştir:
                            </p>

                            <div className="mt-6 space-y-6">
                                {[
                                    {
                                        title: "Üyelik ve Hesap Yönetimi",
                                        data: "Ad, soyad, e-posta, telefon, şifre (hash)",
                                        purpose: "Üyelik kaydı oluşturma, kimlik doğrulama, hesap güvenliği",
                                        legal: "Sözleşmenin ifası (Md. 5/2-c)",
                                        method: "Web sitesi üyelik formu",
                                    },
                                    {
                                        title: "Sipariş ve Satış İşlemleri",
                                        data: "Ad, soyad, adres, telefon, sipariş detayları, fatura bilgileri",
                                        purpose: "Sipariş işleme, faturalama, teslimat, iade ve değişim süreçleri",
                                        legal: "Sözleşmenin ifası (Md. 5/2-c), Kanuni yükümlülük (Md. 5/2-ç)",
                                        method: "Sipariş formu, ödeme sayfası",
                                    },
                                    {
                                        title: "Ödeme İşlemleri",
                                        data: "Kredi kartı bilgileri, banka hesap bilgileri",
                                        purpose: "Ödeme tahsilâtı, 3D Secure doğrulama, iade ödemeleri",
                                        legal: "Sözleşmenin ifası (Md. 5/2-c)",
                                        method: "Ödeme altyapısı (PCI DSS uyumlu)",
                                    },
                                    {
                                        title: "Antika Eser Belgeleme",
                                        data: "Ad, soyad, T.C. kimlik no, satın alma bilgileri",
                                        purpose: "Orijinallik sertifikası, provenans kaydı, 2863 sayılı Kanun bildirimleri",
                                        legal: "Kanuni yükümlülük (Md. 5/2-ç), Hakkın tesisi (Md. 5/2-e)",
                                        method: "Satış sözleşmesi, sertifika düzenleme",
                                    },
                                    {
                                        title: "Müşteri İletişimi",
                                        data: "Ad, e-posta, telefon, destek talep içerikleri",
                                        purpose: "Destek taleplerinin yanıtlanması, şikâyet yönetimi",
                                        legal: "Sözleşmenin ifası (Md. 5/2-c), Meşru menfaat (Md. 5/2-f)",
                                        method: "İletişim formu, e-posta, telefon",
                                    },
                                    {
                                        title: "Pazarlama ve İletişim",
                                        data: "Ad, e-posta, tercihler, satın alma geçmişi",
                                        purpose: "Kampanya bildirimleri, yeni koleksiyon duyuruları, kişiselleştirilmiş öneriler",
                                        legal: "Açık rıza (Md. 5/1)",
                                        method: "E-posta bülteni, web sitesi",
                                    },
                                    {
                                        title: "Web Sitesi Güvenliği",
                                        data: "IP adresi, tarayıcı bilgisi, erişim logları",
                                        purpose: "Dolandırıcılık önleme, siber güvenlik, site performansı",
                                        legal: "Meşru menfaat (Md. 5/2-f), Kanuni yükümlülük (Md. 5/2-ç)",
                                        method: "Otomatik toplama (sunucu logları, güvenlik sistemleri)",
                                    },
                                ].map((item) => (
                                    <div key={item.title} className="rounded-lg border border-border p-5">
                                        <h3 className="font-serif text-lg font-semibold text-foreground">{item.title}</h3>
                                        <div className="mt-3 grid gap-2 text-sm">
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <span className="shrink-0 font-semibold text-foreground w-32">İşlenen Veriler:</span>
                                                <span className="text-muted-foreground">{item.data}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <span className="shrink-0 font-semibold text-foreground w-32">Amaç:</span>
                                                <span className="text-muted-foreground">{item.purpose}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <span className="shrink-0 font-semibold text-foreground w-32">Hukuki Sebep:</span>
                                                <span className="text-muted-foreground">{item.legal}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <span className="shrink-0 font-semibold text-foreground w-32">Toplama Yöntemi:</span>
                                                <span className="text-muted-foreground">{item.method}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Aktarım */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Kişisel Verilerin Aktarılması</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Toplanan kişisel verileriniz; KVKK&apos;nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak:
                            </p>
                            <ul className="mt-4 space-y-3 text-muted-foreground">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Kargo firmaları ile teslimat amacıyla (ad, adres, telefon)
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Ödeme kuruluşları ve bankalar ile ödeme tahsilâtı amacıyla
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Kültür ve Turizm Bakanlığı ile 2863 sayılı Kanun kapsamında tescilli eser bildirimi amacıyla
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Gelir İdaresi Başkanlığı ve mali müşavir ile vergi mevzuatı kapsamında
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Yetkili kamu kurum ve kuruluşları ile yasal talep halinde
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary font-bold">→</span>
                                    Sigorta şirketleri ile yüksek değerli eser sigortalama amacıyla
                                </li>
                            </ul>
                        </section>

                        {/* Haklar */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Veri Sahibi Olarak Haklarınız</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                KVKK&apos;nın 11. maddesi gereğince, şirketimize başvurarak kişisel verilerinizle ilgili şu haklarınızı kullanabilirsiniz:
                            </p>
                            <div className="mt-6 space-y-2">
                                {[
                                    "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                                    "Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme",
                                    "Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme",
                                    "Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme",
                                    "Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme",
                                    "KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme",
                                    "Düzeltme, silme ve yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme",
                                    "İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme",
                                    "Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme",
                                ].map((right, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-muted-foreground">{right}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Başvuru */}
                        <section>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Başvuru Yöntemi</h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerden biriyle şirketimize başvurabilirsiniz:
                            </p>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="font-serif text-base font-semibold text-foreground">Yazılı Başvuru</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Islak imzalı dileğçe ile {address || "mevcut adresimize"} şahsen
                                        veya noter kanalıyla iadeli taahhütlü posta ile iletebilirsiniz.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="font-serif text-base font-semibold text-foreground">Elektronik Başvuru</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Kayıtlı elektronik posta (KEP) adresinizden veya sisteminizde kayıtlı e-posta adresinizden
                                        <strong className="text-foreground"> kvkk@canantika.com</strong> adresine başvurabilirsiniz.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 rounded-lg bg-accent/10 border border-accent/20 p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Yanıt Süresi:</strong> Başvurunuz, talebin niteliğine göre
                                    en kısa sürede ve en geç <strong className="text-foreground">30 gün</strong> içinde ücretsiz
                                    olarak sonuçlandırılacaktır. İşlemin ayrıca bir maliyet gerektirmesi halinde, Kişisel Verileri
                                    Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
                                </p>
                            </div>
                        </section>

                        {/* İlgili Sayfalar */}
                        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
                            <p className="font-serif font-semibold text-foreground mb-3">İlgili Hukuki Metinler</p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/gizlilik" className="text-sm text-primary hover:underline">Gizlilik Politikası →</Link>
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
