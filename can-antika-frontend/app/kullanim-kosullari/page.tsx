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
  title: "Kullanım Koşulları | Can Antika",
  description:
    "Can Antika web sitesi kullanım koşulları. Antika eser satışı, üyelik, sipariş, ödeme, fikri mülkiyet ve uyuşmazlık çözümü hakkında detaylı kurallar.",
  keywords: ["kullanım koşulları", "can antika kurallar", "antika satış koşulları", "e-ticaret kullanım"],
  openGraph: {
    title: "Kullanım Koşulları | Can Antika",
    description: "Antika eser e-ticaret platformumuzun kullanım koşullarını inceleyin.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function TermsPage() {
  const s = await fetchSiteSettings()
  const companyName = s?.companyName || "Can Antika Ticaret Ltd. Şti."
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
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Kullanım Koşulları</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">Son güncelleme: 17 Şubat 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          {/* Quick Nav */}
          <nav className="mb-12 rounded-lg border border-border bg-muted/50 p-6">
            <p className="font-serif text-lg font-semibold text-foreground mb-4">İçindekiler</p>
            <ol className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground list-decimal list-inside">
              <li><a href="#genel" className="hover:text-primary transition-colors">Genel Hükümler</a></li>
              <li><a href="#tanimlar" className="hover:text-primary transition-colors">Tanımlar</a></li>
              <li><a href="#hizmet" className="hover:text-primary transition-colors">Hizmet Tanımı</a></li>
              <li><a href="#uyelik" className="hover:text-primary transition-colors">Üyelik</a></li>
              <li><a href="#siparis" className="hover:text-primary transition-colors">Sipariş ve Ödeme</a></li>
              <li><a href="#orijinallik" className="hover:text-primary transition-colors">Orijinallik ve Kondisyon</a></li>
              <li><a href="#kulturel" className="hover:text-primary transition-colors">Kültürel Miras Mevzuatı</a></li>
              <li><a href="#fikri" className="hover:text-primary transition-colors">Fikri Mülkiyet</a></li>
              <li><a href="#yasaklar" className="hover:text-primary transition-colors">Yasaklanan Kullanımlar</a></li>
              <li><a href="#sorumluluk" className="hover:text-primary transition-colors">Sorumluluk Sınırlaması</a></li>
              <li><a href="#hukuk" className="hover:text-primary transition-colors">Uygulanacak Hukuk</a></li>
              <li><a href="#iletisim" className="hover:text-primary transition-colors">İletişim</a></li>
            </ol>
          </nav>

          <div className="prose prose-lg max-w-none space-y-12">
            {/* 1. Genel */}
            <section id="genel">
              <h2 className="font-serif text-2xl font-semibold text-foreground">1. Genel Hükümler</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu web sitesini (<strong className="text-foreground">www.canantika.com</strong>) kullanarak,
                aşağıdaki kullanım koşullarını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.
                Can Antika Ticaret Ltd. Şti. (&quot;Can Antika&quot;), bu koşulları herhangi bir zamanda
                güncelleme hakkını saklı tutar. Güncellenmiş koşullar sitede yayınlandığı tarihte yürürlüğe girer.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Bu koşullar; 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, 6502 sayılı Tüketicinin
                Korunması Hakkında Kanun ve ilgili yönetmelikler çerçevesinde hazırlanmıştır.
              </p>
            </section>

            {/* 2. Tanımlar */}
            <section id="tanimlar">
              <h2 className="font-serif text-2xl font-semibold text-foreground">2. Tanımlar</h2>
              <div className="mt-4 space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">&quot;Site&quot;</strong>: www.canantika.com alan adı üzerinden yayınlanan web sitesi.</p>
                <p><strong className="text-foreground">&quot;Satıcı&quot;</strong>: Can Antika Ticaret Ltd. Şti.</p>
                <p><strong className="text-foreground">&quot;Kullanıcı&quot;</strong>: Siteye erişen, üye olan veya alışveriş yapan gerçek veya tüzel kişi.</p>
                <p><strong className="text-foreground">&quot;Antika Eser&quot;</strong>: Tarihi, sanatsal veya kültürel değer taşıyan, kural olarak 100 yıldan eski taşınır kültür varlıkları.</p>
                <p><strong className="text-foreground">&quot;Provenans&quot;</strong>: Bir eserin sahiplik geçmişi, üretim yeri ve dönemine ilişkin belgeleme zinciri.</p>
                <p><strong className="text-foreground">&quot;Kondisyon&quot;</strong>: Eserin fiziksel durumu; aşınma, restorasyon, eksiklik gibi detayları içeren rapor.</p>
              </div>
            </section>

            {/* 3. Hizmet */}
            <section id="hizmet">
              <h2 className="font-serif text-2xl font-semibold text-foreground">3. Hizmet Tanımı</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Can Antika, antika mobilya, porselen, saat, halı, tablo, gümüş eşya ve diğer koleksiyon
                parçalarının çevrimiçi satışını gerçekleştiren bir e-ticaret platformudur. Sunduğumuz hizmetler:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Özgün antika eserlerin satışı</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Uzman değerlendirme ve sertifikalama</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Profesyonel paketleme ve sigortalı teslimat</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Restorasyon danışmanlığı</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Koleksiyon oluşturma rehberliği</li>
              </ul>
              <div className="mt-4 rounded-lg bg-accent/10 border border-accent/20 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Önemli:</strong> Sitemizdeki tüm ürünler tek ve özgün
                  parçalardır. Bir ürün satıldığında, aynı ürünün tekrar satışa sunulması mümkün değildir.
                  Stok durumu anlık olarak güncellenmekte olup, sepete ekleme stok garantisi sağlamaz;
                  stok ödeme onayı ile kesinleşir.
                </p>
              </div>
            </section>

            {/* 4. Üyelik */}
            <section id="uyelik">
              <h2 className="font-serif text-2xl font-semibold text-foreground">4. Üyelik</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">Sitemizden alışveriş yapabilmek için üye olmanız gerekmektedir. Üyelik koşulları:</p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.1</span>18 yaşından büyük olmanız gerekmektedir.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.2</span>Kayıt sırasında doğru, güncel ve eksiksiz bilgiler vermeyi kabul edersiniz.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.3</span>Hesap güvenliğinizden (şifre, erişim) tamamen siz sorumlusunuz.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.4</span>Hesabınızı üçüncü kişilere devretmeniz veya paylaşmanız yasaktır.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.5</span>Bir kişi yalnızca bir üyelik hesabına sahip olabilir.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">4.6</span>
                  Can Antika, gerekçe göstererek veya herhangi bir zamanda üyeliği askıya alma veya sonlandırma hakkını saklı tutar.
                </li>
              </ul>
            </section>

            {/* 5. Sipariş ve Ödeme */}
            <section id="siparis">
              <h2 className="font-serif text-2xl font-semibold text-foreground">5. Sipariş ve Ödeme</h2>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">5.1</span>Fiyatlar Türk Lirası (₺) cinsindendir ve KDV dahildir.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">5.2</span>Sipariş, ödeme onaylandıktan sonra kesinleşir. Havale/EFT ile yapılan ödemelerde, tutarın hesabımıza geçmesiyle sipariş onaylanır.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">5.3</span>Antika eserlerin tek parça olması nedeniyle, stok durumuna göre siparişler iptal edilebilir. Bu durumda ödeme tutar tam olarak iade edilir.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">5.4</span>Fiyat ve bilgi hataları durumunda düzeltme hakkımız saklıdır. Belirgin fiyat hatası nedeniyle yapılan satışlarda, sipariş iptal edilebilir.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">5.5</span>İlgili mevzuat gereğince e-fatura veya e-arşiv fatura düzenlenmektedir.</li>
              </ul>
            </section>

            {/* 6. Orijinallik */}
            <section id="orijinallik">
              <h2 className="font-serif text-2xl font-semibold text-foreground">6. Ürün Orijinalliği ve Kondisyon</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sitemizdeki tüm antika ürünler:
              </p>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Uzman ekibimiz tarafından orijinallik, dönem ve kondisyon açısından değerlendirilmiştir.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Talep halinde <strong className="text-foreground">orijinallik sertifikası</strong> düzenlenmektedir.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Detaylı <strong className="text-foreground">kondisyon raporu</strong> ürün sayfasında yer almaktadır.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Fotoğraflar eserin gerçek görselleridir; ancak ekran ayarlarına bağlı minimal renk farklılıkları olabilir.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Antika eserlerin yaşına uygun doğal aşınma, patina ve kullanım izleri <strong className="text-foreground">kusur değil, otantiklik göstergesidir</strong>.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Varsa restorasyon geçmişi ve yapılan müdahaleler şeffaf bir şekilde belirtilir.
                </li>
              </ul>
            </section>

            {/* 7. Kültürel Miras */}
            <section id="kulturel">
              <h2 className="font-serif text-2xl font-semibold text-foreground">7. Kültürel Miras ve Mevzuat</h2>
              <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
                <p className="text-muted-foreground leading-relaxed">
                  Can Antika, 2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu kapsamında faaliyet
                  göstermektedir. Tescilli kültür varlıkları, Kültür ve Turizm Bakanlığı&apos;ndan alınmış
                  ruhsatname ile satışa sunulmaktadır.
                </p>
              </div>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">7.1</span>
                  Satışa sunulan tüm eserler, yasal yollarla edinilmiş ve belgelenmiş parçalardır.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">7.2</span>
                  Tescilli kültür varlıkları yurt dışına çıkarılamaz. Bu tür eserlerin satışı yalnızca
                  Türkiye sınırları içerisinde geçerlidir.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">7.3</span>
                  Alıcı, satın aldığı tescilli eserleri ilgili mevzuata uygun şekilde muhafaza etmekle yükümlüdür.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">7.4</span>
                  Etnografik nitelikteki eserler ve belirli dönem sikkeler, tescile tabi olmaksızın serbestçe alınıp satılabilir.
                </li>
              </ul>
            </section>

            {/* 8. Fikri Mülkiyet */}
            <section id="fikri">
              <h2 className="font-serif text-2xl font-semibold text-foreground">8. Fikri Mülkiyet Hakları</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu sitedeki tüm içerik (metin, fotoğraf, logo, tasarım, grafik, yazılım kodu, ürün
                açıklamaları ve değerlendirme raporları) Can Antika&apos;nın veya lisans verenlerinin
                mülkiyetindedir ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile korunmaktadır.
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>İçeriklerin izinsiz kopyalanması, çoğaltılması veya dağıtılması yasaktır.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Ürün fotoğraflarının ticari amaçla kullanılması yasaktır.</li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>Değerlendirme raporları ve sertifikalar yalnızca ilgili eserin sahibi tarafından kullanılabilir.</li>
              </ul>
            </section>

            {/* 9. Yasaklanan Kullanımlar */}
            <section id="yasaklar">
              <h2 className="font-serif text-2xl font-semibold text-foreground">9. Yasaklanan Kullanımlar</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kullanıcılar, aşağıdaki eylemleri gerçekleştirmemeyi kabul eder:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Sahte veya yanıltıcı bilgilerle sipariş vermek</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Site güvenliğini tehlikeye atacak yazılım veya araçlar kullanmak</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Otomatik veri toplama (scraping, crawling) yapmak</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Başkalarının hesaplarına yetkisiz erişim sağlamak</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Ürün değerlendirmelerinde yanıltıcı veya kötü niyetli yorumlar yapmak</li>
                <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✕</span>Satın alınan tescilli eserleri mevzuata aykırı şekilde yurt dışına çıkarmak</li>
              </ul>
            </section>

            {/* 10. Sorumluluk Sınırlaması */}
            <section id="sorumluluk">
              <h2 className="font-serif text-2xl font-semibold text-foreground">10. Sorumluluk Sınırlaması</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Can Antika, yasal sınırlar dahilinde:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Web sitesinin kesintisiz veya hatasız çalışacağını garanti etmez.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Site kullanımından kaynaklanan doğrudan veya dolaylı zararlardan sorumlu tutulamaz.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Antika eserlerin doğasına uygun yaş ve kullanım izleri hasar olarak kabul edilmez.
                </li>
                <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span>
                  Mücbir sebepler (doğal afet, savaş, pandemi, yasal düzenlemeler) nedeniyle
                  oluşabilecek gecikmelerden sorumlu tutulamaz.
                </li>
              </ul>
            </section>

            {/* 11. Uygulanacak Hukuk */}
            <section id="hukuk">
              <h2 className="font-serif text-2xl font-semibold text-foreground">11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir. Tüketici işlemlerinden doğan
                uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri; ticari işlemlerden
                doğan uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            {/* 12. İletişim */}
            <section id="iletisim">
              <h2 className="font-serif text-2xl font-semibold text-foreground">12. İletişim</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kullanım koşulları hakkındaki soru, görüş ve önerileriniz için:
              </p>
              <div className="mt-4 rounded-lg bg-muted p-6">
                <p className="font-serif font-semibold text-foreground">{companyName}</p>
                {email && <p className="mt-2 text-muted-foreground">E-posta: {email}</p>}
                {phone && <p className="text-muted-foreground">Telefon: {phone}</p>}
                {address && <p className="text-muted-foreground">Adres: {address}</p>}
              </div>
            </section>

            {/* İlgili Sayfalar */}
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <p className="font-serif font-semibold text-foreground mb-3">İlgili Hukuki Metinler</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/gizlilik" className="text-sm text-primary hover:underline">Gizlilik Politikası →</Link>
                <Link href="/kvkk" className="text-sm text-primary hover:underline">KVKK Aydınlatma Metni →</Link>
                <Link href="/mesafeli-satis-sozlesmesi" className="text-sm text-primary hover:underline">Mesafeli Satış Sözleşmesi →</Link>
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
