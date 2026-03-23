import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Can Antika Gizlilik ve Kişisel Verilerin Korunması Politikası. 6698 sayılı KVKK kapsamında kişisel verilerinizin toplanması, işlenmesi, saklanması ve korunması hakkında detaylı bilgi.",
  keywords: ["gizlilik politikası", "kvkk", "kişisel veri koruma", "can antika gizlilik", "6698 kvkk"],
  openGraph: {
    title: "Gizlilik Politikası",
    description: "6698 sayılı KVKK kapsamında kişisel verilerinizin korunması hakkında detaylı bilgi.",
    type: "website",
    locale: "tr_TR",
  },
}

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Gizlilik ve Kişisel Verilerin Korunması Politikası</h1>
            <p className="mt-4 text-lg text-primary-foreground/80">Son Güncelleme: 23 Mart 2026</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="prose prose-lg max-w-none space-y-12">
            <p className="text-muted-foreground leading-relaxed">
              Bu Gizlilik ve Kişisel Verilerin Korunması Politikası, canantika.com üzerinden sunulan hizmetler kapsamında işlenen kişisel verilere ilişkin bilgilendirme amacıyla hazırlanmıştır.
            </p>

            {/* 1. Veri Sorumlusu */}
            <section id="veri-sorumlusu">
              <h2 className="font-serif text-2xl font-semibold text-foreground">1. Veri Sorumlusu</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla aşağıdaki kişi/işletme tarafından işlenmektedir:
              </p>
              <div className="mt-4 rounded-lg bg-muted p-6 space-y-2">
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Veri Sorumlusu:</strong> Mesut Can (Şahıs İşletmesi)</p>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Faaliyet Konusu:</strong> Antika Perakende Ticareti</p>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Adres:</strong> Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</p>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">Telefon:</strong> +90 507 687 92 15</p>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">E-posta:</strong> destek@canantika.com</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground italic">
                Not: Vergi levhasında ticaret unvanı alanı boş olduğundan, sitede kamuya açık metinlerde “Mesut Can (Şahıs İşletmesi)” ifadesinin kullanılması daha uygundur.
              </p>
            </section>

            {/* 2. Toplanan Kişisel Veriler */}
            <section id="toplanan-veriler">
              <h2 className="font-serif text-2xl font-semibold text-foreground">2. Toplanan Kişisel Veriler</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sunduğumuz hizmetlerin niteliğine göre aşağıdaki kişisel veriler işlenebilir:
              </p>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">a) Kimlik ve İletişim Bilgileri</h3>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>Ad, soyad</li>
                    <li>Telefon numarası</li>
                    <li>E-posta adresi</li>
                    <li>Teslimat ve fatura adresi</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">b) Sipariş ve İşlem Bilgileri</h3>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>Sipariş içeriği</li>
                    <li>Sepet ve satın alma bilgileri</li>
                    <li>Sipariş, teslimat, iade ve iptal kayıtları</li>
                    <li>Fatura bilgileri</li>
                    <li>Talep, şikayet ve destek kayıtları</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">c) İşlem Güvenliği ve Teknik Veriler</h3>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>IP adresi</li>
                    <li>Oturum ve giriş kayıtları</li>
                    <li>Tarayıcı tipi, cihaz bilgisi, işletim sistemi bilgisi</li>
                    <li>Çerez ve site kullanım verileri</li>
                    <li>Hata kayıtları ve güvenlik logları</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">d) Finansal Bilgiler</h3>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>Ödeme işlemine ilişkin sınırlı bilgiler</li>
                    <li>İade işlemleri için gerekli banka/IBAN bilgileri (varsa)</li>
                  </ul>
                  <div className="mt-4 p-4 border-l-4 border-primary bg-primary/5 rounded-r">
                    <p className="text-sm text-foreground">
                      <strong>Önemli:</strong> Kredi kartı bilgileriniz sistemlerimizde saklanmaz. Ödeme sırasında girilen kart bilgileri, güvenli bağlantı üzerinden doğrudan yetkili ve lisanslı ödeme kuruluşu / banka altyapısına iletilir.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-medium text-foreground">e) Antika Ürünlere Özgü Bilgiler</h3>
                  <p className="mt-2 text-muted-foreground">Sunulan hizmete göre aşağıdaki veriler de işlenebilir:</p>
                  <ul className="mt-2 list-disc list-inside text-muted-foreground space-y-1">
                    <li>Ürüne ilişkin görseller ve açıklamalar</li>
                    <li>Ekspertiz / değerlendirme talebi içeriği</li>
                    <li>Ürün kondisyonuna, ölçüsüne, materyaline, dönemine ve varsa restorasyon bilgilerine ilişkin kayıtlar</li>
                    <li>Satış sonrası ispat ve belge süreçlerine ilişkin kayıtlar</li>
                  </ul>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground italic">
                Not: T.C. kimlik numarası, vergi numarası veya benzeri ek veriler ancak mevzuat gerektiriyorsa ya da somut işlem için gerçekten zorunluysa işlenir.
              </p>
            </section>

            {/* 3. İşleme Amaçları */}
            <section id="isleme-amaci">
              <h2 className="font-serif text-2xl font-semibold text-foreground">3. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz aşağıdaki amaçlarla işlenebilir:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>Üyelik ve müşteri hesabı süreçlerinin yürütülmesi</li>
                <li>Siparişlerin alınması, hazırlanması, faturalandırılması ve teslim edilmesi</li>
                <li>Ödeme, tahsilat, iade ve iptal süreçlerinin yürütülmesi</li>
                <li>Müşteri destek, talep ve şikayet süreçlerinin yönetilmesi</li>
                <li>Mesafeli satış sözleşmesi ve ilgili yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Site güvenliğinin sağlanması, kötüye kullanımın ve dolandırıcılık riskinin önlenmesi</li>
                <li>Muhasebe, vergi ve arşiv yükümlülüklerinin yerine getirilmesi</li>
                <li>Ürünlere ilişkin açıklama, belge, ekspertiz veya satış sonrası ispat süreçlerinin yürütülmesi</li>
                <li>Açık rızanız olması halinde kampanya, duyuru ve bilgilendirme gönderilmesi</li>
                <li>Hizmet kalitesinin geliştirilmesi ve kullanıcı deneyiminin iyileştirilmesi</li>
              </ul>
            </section>

            {/* 4. Hukuki Sebep */}
            <section id="hukuki-sebep">
              <h2 className="font-serif text-2xl font-semibold text-foreground">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, KVKK’nın 5. maddesinde düzenlenen hukuki sebeplere dayanılarak işlenmektedir. Bunlar özellikle:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması</li>
                <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması</li>
                <li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li>
                <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati için veri işlenmesinin zorunlu olması</li>
                <li>Açık rıza gerektiren hallerde ilgili kişinin açık rızasının bulunması</li>
              </ul>
            </section>

            {/* 5. Paylaşım */}
            <section id="paylasim">
              <h2 className="font-serif text-2xl font-semibold text-foreground">5. Kişisel Verilerin Kimlerle Paylaşılabileceği</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, işleme amaçlarıyla sınırlı olmak üzere aşağıdaki alıcı gruplarıyla paylaşılabilir:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li><strong className="text-foreground font-medium">Kargo ve lojistik firmaları:</strong> Teslimat ve gönderi takibi</li>
                <li><strong className="text-foreground font-medium">Ödeme kuruluşları / bankalar:</strong> Güvenli ödeme işlemlerinin yürütülmesi</li>
                <li><strong className="text-foreground font-medium">Muhasebe ve mali müşavirlik hizmet sağlayıcıları:</strong> Fatura, muhasebe ve vergi süreçleri</li>
                <li><strong className="text-foreground font-medium">Bilgi teknolojileri ve altyapı hizmet sağlayıcıları:</strong> Barındırma, e-posta, güvenlik ve teknik destek hizmetleri</li>
                <li><strong className="text-foreground font-medium">Yetkili kamu kurum ve kuruluşları:</strong> Mevzuattan doğan yükümlülükler kapsamında</li>
                <li><strong className="text-foreground font-medium">Hukuk danışmanları ve denetim hizmet sağlayıcıları:</strong> Hukuki süreçlerin yürütülmesi, hakların korunması</li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, yukarıdaki kapsam dışında üçüncü kişilere satılmaz, kiralanmaz veya amaç dışı kullandırılmaz.
              </p>
            </section>

            {/* 6. Yurt Dışı */}
            <section id="yurt-disi">
              <h2 className="font-serif text-2xl font-semibold text-foreground">6. Yurt Dışına Veri Aktarımı</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kullandığımız bazı teknik altyapılar, e-posta sistemleri, barındırma veya yazılım hizmetleri nedeniyle kişisel verileriniz yurt dışındaki sunucularda işlenebilir veya saklanabilir.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu tür aktarımlar, KVKK’nın yürürlükteki 9. maddesi ve ilgili düzenlemeler uyarınca;
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>yeterlilik kararı bulunması,</li>
                <li>uygun güvencelerin sağlanması,</li>
                <li>standart sözleşmeler veya ilgili mevzuatta öngörülen diğer hukuki mekanizmaların kullanılması,</li>
                <li>gerektiğinde açık rıza alınması</li>
              </ul>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                esaslarına uygun şekilde gerçekleştirilir.
              </p>
            </section>

            {/* 7. Saklama Süreleri */}
            <section id="saklama">
              <h2 className="font-serif text-2xl font-semibold text-foreground">7. Saklama Süreleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacı için gerekli olan makul süre boyunca saklanır. Başlıca örnekler aşağıdaki gibidir:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li><strong className="text-foreground font-medium">Sipariş ve fatura kayıtları:</strong> İlgili vergi ve ticaret mevzuatında öngörülen süre boyunca</li>
                <li><strong className="text-foreground font-medium">Mesafeli satışa ilişkin işlem kayıtları:</strong> İlgili yasal süreler boyunca</li>
                <li><strong className="text-foreground font-medium">Müşteri destek kayıtları:</strong> Talebin niteliğine göre makul süre boyunca</li>
                <li><strong className="text-foreground font-medium">İşlem güvenliği kayıtları ve loglar:</strong> Güvenlik ve ispat yükümlülükleri kapsamında gerekli süre boyunca</li>
                <li><strong className="text-foreground font-medium">Pazarlama izin kayıtları:</strong> İzin geri alınana kadar veya ilgili mevzuat süresince</li>
                <li><strong className="text-foreground font-medium">Ürün ekspertiz / belge / satış sonrası ispat kayıtları:</strong> Talebin niteliğine ve hukuki gerekliliğe göre gerekli süre boyunca</li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Saklama süresi sona eren kişisel veriler, mevzuata uygun şekilde silinir, yok edilir veya anonim hale getirilir.
              </p>
            </section>

            {/* 8. Veri Güvenliği */}
            <section id="guvenlik">
              <h2 className="font-serif text-2xl font-semibold text-foreground">8. Veri Güvenliği</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Kişisel verilerinizin güvenliğini sağlamak amacıyla makul ve uygun teknik ve idari tedbirler alınmaktadır. Bu kapsamda örnek olarak:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>SSL/TLS ile güvenli veri iletimi</li>
                <li>Yetki sınırlandırması ve erişim kontrolleri</li>
                <li>Güncel güvenlik yazılımları ve sunucu koruma önlemleri</li>
                <li>Kayıt ve loglama sistemleri</li>
                <li>Yedekleme süreçleri</li>
                <li>Hizmet alınan üçüncü taraflarla veri güvenliği yükümlülüklerinin düzenlenmesi</li>
                <li>Personel ve süreç bazlı gizlilik önlemleri</li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                uygulanmaktadır.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Buna rağmen internet üzerinden gerçekleştirilen veri aktarımının mutlak surette risksiz olduğu garanti edilemez. Bu nedenle kullanıcıların da hesap güvenliği ve şifre güvenliği konusunda gerekli dikkat ve özeni göstermesi gerekir.
              </p>
            </section>

            {/* 9. Ödeme Güvenliği */}
            <section id="odeme-guvenligi">
              <h2 className="font-serif text-2xl font-semibold text-foreground">9. Ödeme Güvenliği</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sitemizde gerçekleştirilen ödeme işlemlerinde kart bilgileriniz tarafımızca kaydedilmez, depolanmaz veya doğrudan erişilmez. Ödeme sayfasında girilen kart verileri, güvenli bağlantı üzerinden doğrudan bankaya veya yetkili ödeme kuruluşuna iletilir.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Ödeme işlemlerinde, ilgili ödeme altyapısının sunduğu güvenlik önlemleri ve doğrulama mekanizmaları kullanılabilir.
              </p>
            </section>

            {/* 10. Çerezler */}
            <section id="cerezler">
              <h2 className="font-serif text-2xl font-semibold text-foreground">10. Çerezler ve Benzeri Teknolojiler</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sitemizde kullanıcı deneyimini iyileştirmek, güvenliği sağlamak ve site performansını ölçmek amacıyla çerezler ve benzeri teknolojiler kullanılabilir.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Zorunlu olmayan çerezler, yürürlükteki mevzuat kapsamında gerekli olduğu ölçüde açık rızanıza tabi olarak çalıştırılır. Çerezlere ilişkin ayrıntılı bilgi için ayrıca yayımlanan <Link href="/cerezler" className="text-primary hover:underline">Çerez Politikası</Link> metnini inceleyebilirsiniz.
              </p>
            </section>

            {/* 11. Antika Ürünlere Özel */}
            <section id="antika-ozel">
              <h2 className="font-serif text-2xl font-semibold text-foreground">11. Antika Ürünlere İlişkin Özel Açıklamalar</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Satışa sunulan ürünler, antika / koleksiyon ürünü niteliği taşıyabileceğinden ürün açıklamalarında; dönem, kondisyon, ölçü, materyal, mevcut durum, varsa restorasyon bilgisi ve ürünün ayırt edici özellikleri yer alabilir.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">Ayrıca:</p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>Ürünlere ilişkin görsel ve açıklamalar, satış öncesi bilgilendirme ve satış sonrası ispat amacıyla saklanabilir.</li>
                <li>Ekspertiz veya değerlendirme talebiniz olması halinde, ilettiğiniz görseller ve açıklamalar uzman görüşü alınması amacıyla ilgili kişi veya hizmet sağlayıcılarla paylaşılabilir.</li>
                <li>Ürünün hukuki niteliğine göre mevzuattan doğan özel bir bildirim veya kayıt yükümlülüğü bulunması halinde, yalnızca gerekli bilgiler yetkili kamu kurumlarıyla paylaşılabilir.</li>
                <li>Ürün özgünlüğü, kondisyonu veya kullanım izleri ürün bazında ayrıca açıklanabilir; bu açıklamalar satış sözleşmesinin ve satış sonrası uyuşmazlık süreçlerinin parçası olarak değerlendirilebilir.</li>
              </ul>
            </section>

            {/* 12. Haklarınız */}
            <section id="haklariniz">
              <h2 className="font-serif text-2xl font-semibold text-foreground">12. KVKK Kapsamındaki Haklarınız</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                KVKK’nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
                <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
                <li>Mevzuat şartları çerçevesinde silinmesini veya yok edilmesini isteme</li>
                <li>Yapılan düzeltme, silme veya yok etme işlemlerinin üçüncü kişilere bildirilmesini isteme</li>
                <li>Münhasıran otomatik sistemler ile analiz edilmesi sebebiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>
            </section>

            {/* 13. Başvuru Yöntemi */}
            <section id="basvuru-yontemi">
              <h2 className="font-serif text-2xl font-semibold text-foreground">13. Başvuru Yöntemi</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                KVKK kapsamındaki taleplerinizi;
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground list-disc list-inside">
                <li>yazılı ve imzalı olarak yukarıda yer alan iş yeri adresine,</li>
                <li>güvenli elektronik imza veya mobil imza kullanarak,</li>
                <li>sistemimizde kayıtlı bulunan e-posta adresiniz üzerinden,</li>
                <li>veya mevzuatın izin verdiği diğer yöntemlerle</li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                bize iletebilirsiniz.
              </p>
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Başvurularınızı şu e-posta adresi üzerinden de iletebilirsiniz:</p>
                <p className="text-foreground font-medium mt-1">destek@canantika.com</p>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Başvurular, ilgili mevzuat çerçevesinde mümkün olan en kısa sürede ve en geç yasal süre içinde sonuçlandırılır.
              </p>
            </section>

            {/* 14. Politika Değişiklikleri */}
            <section id="politika-degisiklikleri">
              <h2 className="font-serif text-2xl font-semibold text-foreground">14. Politika Değişiklikleri</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu politika, mevzuat değişiklikleri, teknik gereklilikler veya hizmet süreçlerindeki güncellemeler doğrultusunda zaman zaman revize edilebilir. Güncel metin, internet sitemizde yayımlandığı tarihten itibaren geçerli olur.
              </p>
            </section>

            {/* 15. İletişim */}
            <section id="iletisim">
              <h2 className="font-serif text-2xl font-semibold text-foreground">15. İletişim</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Bu politika hakkında soru, talep veya başvurularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="mt-6 rounded-lg bg-muted p-6">
                <p className="font-serif font-semibold text-foreground">Mesut Can (Şahıs İşletmesi)</p>
                <p className="mt-2 text-muted-foreground"><strong className="text-foreground">Adres:</strong> Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</p>
                <p className="text-muted-foreground"><strong className="text-foreground">Telefon:</strong> +90 507 687 92 15</p>
                <p className="text-muted-foreground"><strong className="text-foreground">E-posta:</strong> destek@canantika.com</p>
              </div>
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
