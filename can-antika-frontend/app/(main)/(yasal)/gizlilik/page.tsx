import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik ve Kişisel Verilerin Korunması Politikası",
  description: "Can Antika Gizlilik ve Kişisel Verilerin Korunması Politikası metni.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground">
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
            <p className="leading-7">6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla aşağıdaki kişi/işletme tarafından işlenmektedir:</p>
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
            <p className="leading-7 text-sm italic">Önemli: Kredi kartı bilgileriniz sistemlerimizde saklanmaz. Ödeme sırasında girilen kart bilgileri, güvenli bağlantı üzerinden doğrudan yetkili ve lisanslı ödeme kuruluşu / banka altyapısına iletilir.</p>
            <p className="font-medium">e) Antika Ürünlere Özgü Bilgiler</p>
            <ul className="list-disc space-y-1 pl-6 leading-7"><li>Ürüne ilişkin görseller ve açıklamalar</li><li>Ekspertiz / değerlendirme talebi içeriği</li><li>Ürün kondisyonuna, ölçüsüne, materyaline, dönemine ve varsa restorasyon bilgilerine ilişkin kayıtlar</li><li>Satış sonrası ispat ve belge süreçlerine ilişkin kayıtlar</li></ul>
            <p className="leading-7 text-sm text-muted-foreground">Not: T.C. kimlik numarası, vergi numarası veya benzeri ek veriler ancak mevzuat gerektiriyorsa ya da somut işlem için gerçekten zorunluysa işlenir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
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

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">4. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2>
            <p className="leading-7">Kişisel verileriniz, KVKK’nın 5. maddesinde düzenlenen hukuki sebeplere dayanılarak işlenmektedir. Bunlar özellikle:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması</li>
              <li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati için veri işlenmesinin zorunlu olması</li>
              <li>Açık rıza gerektiren hallerde ilgili kişinin açık rızasının bulunması</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">5. Kişisel Verilerin Kimlerle Paylaşılabileceği</h2>
            <p className="leading-7">Kişisel verileriniz, işleme amaçlarıyla sınırlı olmak üzere aşağıdaki alıcı gruplarıyla paylaşılabilir:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Kargo ve lojistik firmaları: Teslimat ve gönderi takibi</li>
              <li>Ödeme kuruluşları / bankalar: Güvenli ödeme işlemlerinin yürütülmesi</li>
              <li>Muhasebe ve mali müşavirlik hizmet sağlayıcıları: Fatura, muhasebe ve vergi süreçleri</li>
              <li>Bilgi teknolojileri ve altyapı hizmet sağlayıcıları: Barındırma, e-posta, güvenlik ve teknik destek hizmetleri</li>
              <li>Yetkili kamu kurum ve kuruluşları: Mevzuattan doğan yükümlülükler kapsamında</li>
              <li>Hukuk danışmanları ve denetim hizmet sağlayıcıları: Hukuki süreçlerin yürütülmesi, hakların korunması</li>
            </ul>
            <p className="leading-7">Kişisel verileriniz, yukarıdaki kapsam dışında üçüncü kişilere satılmaz, kiralanmaz veya amaç dışı kullandırılmaz.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">6. Yurt Dışına Veri Aktarımı</h2>
            <p className="leading-7">Kullandığımız bazı teknik altyapılar, e-posta sistemleri, barındırma veya yazılım hizmetleri nedeniyle kişisel verileriniz yurt dışındaki sunucularda işlenebilir veya saklanabilir.</p>
            <p className="leading-7">Bu tür aktarımlar, KVKK’nın yürürlükteki 9. maddesi ve ilgili düzenlemeler uyarınca; yeterlilik kararı bulunması, uygun güvencelerin sağlanması veya ilgili mevzuatta öngörülen diğer hukuki mekanizmaların kullanılması esaslarına uygun şekilde gerçekleştirilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">7. Saklama Süreleri</h2>
            <p className="leading-7">Kişisel verileriniz, ilgili mevzuatta öngörülen süreler ve işleme amacı için gerekli olan makul süre boyunca saklanır. Süre sona erdiğinde veriler silinir, yok edilir veya anonim hale getirilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">8. Veri Güvenliği</h2>
            <p className="leading-7">Kişisel verilerinizin güvenliğini sağlamak amacıyla makul ve uygun teknik ve idari tedbirler alınmaktadır (SSL/TLS iletimi, yetki sınırlandırması, güncel güvenlik yazılımları vb.).</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">9. KVKK Kapsamındaki Haklarınız</h2>
            <p className="leading-7">KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltme isteme, silinmesini talep etme ve zararın giderilmesini isteme gibi haklara sahipsiniz.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">10. İletişim</h2>
            <p className="leading-7">Bu politika hakkındaki soru, talep veya başvurularınız için bizimle iletişime geçebilirsiniz:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Mesut Can (Şahıs İşletmesi)</li>
              <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}