import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Gizlilik ve Kişisel Verilerin Korunması Politikası",
  description: "Can Antika Gizlilik ve Kişisel Verilerin Korunması Politikası metni.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gizlilik ve Kişisel Verilerin Korunması Politikası</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">
            Bu Gizlilik ve Kişisel Verilerin Korunması Politikası, canantika.com üzerinden sunulan hizmetler kapsamında
            işlenen kişisel verilere ilişkin bilgilendirme amacıyla hazırlanmıştır.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">1. Veri Sorumlusu</h2>
            <p className="leading-7">6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla aşağıdaki kişi/işletme tarafından işlenmektedir:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Veri Sorumlusu: Mesut Can (Şahıs İşletmesi)</li>
              <li>Faaliyet Konusu: Antika Perakende Ticareti</li>
              <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">2. Toplanan Kişisel Veriler</h2>
            <p className="leading-7">Sunduğumuz hizmetlerin niteliğine göre aşağıdaki kişisel veriler işlenebilir:</p>
            <p className="font-medium">a) Kimlik ve İletişim Bilgileri</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>Ad, soyad</li><li>Telefon numarası</li><li>E-posta adresi</li><li>Teslimat ve fatura adresi</li></ul>
            <p className="font-medium">b) Sipariş ve İşlem Bilgileri</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>Sipariş içeriği</li><li>Sepet ve satın alma bilgileri</li><li>Sipariş, teslimat, iade ve iptal kayıtları</li><li>Fatura bilgileri</li><li>Talep, şikayet ve destek kayıtları</li></ul>
            <p className="font-medium">c) İşlem Güvenliği ve Teknik Veriler</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>IP adresi</li><li>Oturum ve giriş kayıtları</li><li>Tarayıcı tipi, cihaz bilgisi, işletim sistemi bilgisi</li><li>Çerez ve site kullanım verileri</li><li>Hata kayıtları ve güvenlik logları</li></ul>
            <p className="font-medium">d) Finansal Bilgiler</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>Ödeme işlemine ilişkin sınırlı bilgiler</li><li>İade işlemleri için gerekli banka/IBAN bilgileri (varsa)</li></ul>
            <p className="leading-7">Önemli: Kredi kartı bilgileriniz sistemlerimizde saklanmaz. Ödeme sırasında girilen kart bilgileri, güvenli bağlantı üzerinden doğrudan yetkili ve lisanslı ödeme kuruluşu / banka altyapısına iletilir.</p>
            <p className="font-medium">e) Antika Ürünlere Özgü Bilgiler</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>Ürüne ilişkin görseller ve açıklamalar</li><li>Ekspertiz / değerlendirme talebi içeriği</li><li>Ürün kondisyonuna, ölçüsüne, materyaline, dönemine ve varsa restorasyon bilgilerine ilişkin kayıtlar</li><li>Satış sonrası ispat ve belge süreçlerine ilişkin kayıtlar</li></ul>
            <p className="leading-7">Not: T.C. kimlik numarası, vergi numarası veya benzeri ek veriler ancak mevzuat gerektiriyorsa ya da somut işlem için gerçekten zorunluysa işlenir.</p>
          </section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">3. Kişisel Verilerin İşlenme Amaçları</h2><ul className="list-disc space-y-1 pl-6 leading-7"><li>Üyelik ve müşteri hesabı süreçlerinin yürütülmesi</li><li>Siparişlerin alınması, hazırlanması, faturalandırılması ve teslim edilmesi</li><li>Ödeme, tahsilat, iade ve iptal süreçlerinin yürütülmesi</li><li>Müşteri destek, talep ve şikayet süreçlerinin yönetilmesi</li><li>Mesafeli satış sözleşmesi ve ilgili yasal yükümlülüklerin yerine getirilmesi</li><li>Site güvenliğinin sağlanması, kötüye kullanımın ve dolandırıcılık riskinin önlenmesi</li><li>Muhasebe, vergi ve arşiv yükümlülüklerinin yerine getirilmesi</li><li>Ürünlere ilişkin açıklama, belge, ekspertiz veya satış sonrası ispat süreçlerinin yürütülmesi</li><li>Açık rızanız olması halinde kampanya, duyuru ve bilgilendirme gönderilmesi</li><li>Hizmet kalitesinin geliştirilmesi ve kullanıcı deneyiminin iyileştirilmesi</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2><p className="leading-7">Kişisel verileriniz, KVKK’nın 5. maddesinde düzenlenen hukuki sebeplere dayanılarak işlenmektedir. Bunlar özellikle:</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması</li><li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması</li><li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li><li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati için veri işlenmesinin zorunlu olması</li><li>Açık rıza gerektiren hallerde ilgili kişinin açık rızasının bulunması</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">5. Kişisel Verilerin Kimlerle Paylaşılabileceği</h2><p className="leading-7">Kişisel verileriniz, işleme amaçlarıyla sınırlı olmak üzere aşağıdaki alıcı gruplarıyla paylaşılabilir:</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Kargo ve lojistik firmaları: Teslimat ve gönderi takibi</li><li>Ödeme kuruluşları / bankalar: Güvenli ödeme işlemlerinin yürütülmesi</li><li>Muhasebe ve mali müşavirlik hizmet sağlayıcıları: Fatura, muhasebe ve vergi süreçleri</li><li>Bilgi teknolojileri ve altyapı hizmet sağlayıcıları: Barındırma, e-posta, güvenlik ve teknik destek hizmetleri</li><li>Yetkili kamu kurum ve kuruluşları: Mevzuattan doğan yükümlülükler kapsamında</li><li>Hukuk danışmanları ve denetim hizmet sağlayıcıları: Hukuki süreçlerin yürütülmesi, hakların korunması</li></ul><p className="leading-7">Kişisel verileriniz, yukarıdaki kapsam dışında üçüncü kişilere satılmaz, kiralanmaz veya amaç dışı kullandırılmaz.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">6. Yurt Dışına Veri Aktarımı</h2><p className="leading-7">Kullandığımız bazı teknik altyapılar, e-posta sistemleri, barındırma veya yazılım hizmetleri nedeniyle kişisel verileriniz yurt dışındaki sunucularda işlenebilir veya saklanabilir.</p><p className="leading-7">Bu tür aktarımlar, KVKK’nın yürürlükteki 9. maddesi ve ilgili düzenlemeler uyarınca; yeterlilik kararı bulunması, uygun güvencelerin sağlanması, standart sözleşmeler veya ilgili mevzuatta öngörülen diğer hukuki mekanizmaların kullanılması, gerektiğinde açık rıza alınması esaslarına uygun şekilde gerçekleştirilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">7. Saklama Süreleri</h2><p className="leading-7">Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacı için gerekli olan makul süre boyunca saklanır.</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Sipariş ve fatura kayıtları: İlgili vergi ve ticaret mevzuatında öngörülen süre boyunca</li><li>Mesafeli satışa ilişkin işlem kayıtları: İlgili yasal süreler boyunca</li><li>Müşteri destek kayıtları: Talebin niteliğine göre makul süre boyunca</li><li>İşlem güvenliği kayıtları ve loglar: Güvenlik ve ispat yükümlülükleri kapsamında gerekli süre boyunca</li><li>Pazarlama izin kayıtları: İzin geri alınana kadar veya ilgili mevzuat süresince</li><li>Ürün ekspertiz / belge / satış sonrası ispat kayıtları: Talebin niteliğine ve hukuki gerekliliğe göre gerekli süre boyunca</li></ul><p className="leading-7">Saklama süresi sona eren kişisel veriler, mevzuata uygun şekilde silinir, yok edilir veya anonim hale getirilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">8. Veri Güvenliği</h2><p className="leading-7">Kişisel verilerinizin güvenliğini sağlamak amacıyla makul ve uygun teknik ve idari tedbirler alınmaktadır.</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>SSL/TLS ile güvenli veri iletimi</li><li>Yetki sınırlandırması ve erişim kontrolleri</li><li>Güncel güvenlik yazılımları ve sunucu koruma önlemleri</li><li>Kayıt ve loglama sistemleri</li><li>Yedekleme süreçleri</li><li>Hizmet alınan üçüncü taraflarla veri güvenliği yükümlülüklerinin düzenlenmesi</li><li>Personel ve süreç bazlı gizlilik önlemleri</li></ul><p className="leading-7">Buna rağmen internet üzerinden gerçekleştirilen veri aktarımının mutlak surette risksiz olduğu garanti edilemez. Bu nedenle kullanıcıların da hesap güvenliği ve şifre güvenliği konusunda gerekli dikkat ve özeni göstermesi gerekir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">9. Ödeme Güvenliği</h2><p className="leading-7">Sitemizde gerçekleştirilen ödeme işlemlerinde kart bilgileriniz tarafımızca kaydedilmez, depolanmaz veya doğrudan erişilmez. Ödeme sayfasında girilen kart verileri, güvenli bağlantı üzerinden doğrudan bankaya veya yetkili ödeme kuruluşuna iletilir.</p><p className="leading-7">Ödeme işlemlerinde, ilgili ödeme altyapısının sunduğu güvenlik önlemleri ve doğrulama mekanizmaları kullanılabilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">10. Çerezler ve Benzeri Teknolojiler</h2><p className="leading-7">Sitemizde kullanıcı deneyimini iyileştirmek, güvenliği sağlamak ve site performansını ölçmek amacıyla çerezler ve benzeri teknolojiler kullanılabilir.</p><p className="leading-7">Zorunlu olmayan çerezler, yürürlükteki mevzuat kapsamında gerekli olduğu ölçüde açık rızanıza tabi olarak çalıştırılır. Çerezlere ilişkin ayrıntılı bilgi için ayrıca yayımlanan Çerez Politikası metnini inceleyebilirsiniz.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">11. Antika Ürünlere İlişkin Özel Açıklamalar</h2><p className="leading-7">Satışa sunulan ürünler, antika / koleksiyon ürünü niteliği taşıyabileceğinden ürün açıklamalarında; dönem, kondisyon, ölçü, materyal, mevcut durum, varsa restorasyon bilgisi ve ürünün ayırt edici özellikleri yer alabilir.</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Ürünlere ilişkin görsel ve açıklamalar, satış öncesi bilgilendirme ve satış sonrası ispat amacıyla saklanabilir.</li><li>Ekspertiz veya değerlendirme talebiniz olması halinde, ilettiğiniz görseller ve açıklamalar uzman görüşü alınması amacıyla ilgili kişi veya hizmet sağlayıcılarla paylaşılabilir.</li><li>Ürünün hukuki niteliğine göre mevzuattan doğan özel bir bildirim veya kayıt yükümlülüğü bulunması halinde, yalnızca gerekli bilgiler yetkili kamu kurumlarıyla paylaşılabilir.</li><li>Ürün özgünlüğü, kondisyonu veya kullanım izleri ürün bazında ayrıca açıklanabilir; bu açıklamalar satış sözleşmesinin ve satış sonrası uyuşmazlık süreçlerinin parçası olarak değerlendirilebilir.</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">12. KVKK Kapsamındaki Haklarınız</h2><p className="leading-7">KVKK’nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li><li>İşlenmişse buna ilişkin bilgi talep etme</li><li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li><li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li><li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li><li>Mevzuat şartları çerçevesinde silinmesini veya yok edilmesini isteme</li><li>Yapılan düzeltme, silme veya yok etme işlemlerinin üçüncü kişilere bildirilmesini isteme</li><li>Münhasıran otomatik sistemler ile analiz edilmesi sebebiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li><li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">13. Başvuru Yöntemi</h2><p className="leading-7">KVKK kapsamındaki taleplerinizi; yazılı ve imzalı olarak yukarıda yer alan iş yeri adresine, güvenli elektronik imza veya mobil imza kullanarak, sistemimizde kayıtlı bulunan e-posta adresiniz üzerinden veya mevzuatın izin verdiği diğer yöntemlerle bize iletebilirsiniz.</p><p className="leading-7">Başvurularınızı şu e-posta adresi üzerinden de iletebilirsiniz: destek@canantika.com</p><p className="leading-7">Başvurular, ilgili mevzuat çerçevesinde mümkün olan en kısa sürede ve en geç yasal süre içinde sonuçlandırılır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">14. Politika Değişiklikleri</h2><p className="leading-7">Bu politika, mevzuat değişiklikleri, teknik gereklilikler veya hizmet süreçlerindeki güncellemeler doğrultusunda zaman zaman revize edilebilir. Güncel metin, internet sitemizde yayımlandığı tarihten itibaren geçerli olur.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">15. İletişim</h2><p className="leading-7">Bu politika hakkında soru, talep veya başvurularınız için bizimle iletişime geçebilirsiniz:</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Mesut Can (Şahıs İşletmesi)</li><li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li><li>Telefon: +90 507 687 92 15</li><li>E-posta: destek@canantika.com</li></ul></section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
