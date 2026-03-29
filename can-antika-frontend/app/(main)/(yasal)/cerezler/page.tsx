import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Can Antika Çerez Politikası.",
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Çerez Politikası</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">Bu Çerez Politikası, www.canantika.com internet sitesini ziyaret eden kullanıcılarının cihazlarında kullanılan çerezler ve benzeri teknolojiler hakkında bilgilendirme amacıyla hazırlanmıştır.</p>
          <p className="leading-7">Çerezler yoluyla gerçekleştirilen kişisel veri işleme faaliyetleri bakımından, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) ve ilgili mevzuat hükümleri uygulanır.</p>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">1. Veri Sorumlusu</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Mesut Can (Şahıs İşletmesi)</li>
              <li>Marka: Can Antika</li>
              <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">2. Çerez Nedir?</h2>
            <p className="leading-7">Çerezler, bir internet sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Oturumun devam ettirilmesi, tercihlerin hatırlanması, güvenliğin sağlanması ve performans ölçümü gibi amaçlarla kullanılabilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">3. Çerezleri Hangi Amaçlarla Kullanıyoruz?</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>İnternet sitesinin çalışması ve güvenliğinin sağlanması,</li>
              <li>Oturum yönetimi ve kullanıcı giriş işlemlerinin yürütülmesi,</li>
              <li>Sepet ve sipariş süreçlerinin devam ettirilmesi,</li>
              <li>Dil, bölge veya kullanıcı tercihleri gibi ayarların hatırlanması,</li>
              <li>Site performansının ve kullanım istatistiklerinin analiz edilmesi,</li>
              <li>Reklam, pazarlama ve yeniden hedefleme faaliyetlerinin yürütülmesi,</li>
              <li>Kullanıcı deneyiminin geliştirilmesi.</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">4. Kullandığımız Çerez Türleri</h2>
            <p className="font-medium">A. Zorunlu Çerezler</p>
            <p className="leading-7">Sitenin düzgün çalışması için gereklidir. Kural olarak açık rıza gerektirmeden kullanılabilir.</p>
            <p className="font-medium">B. İşlevsellik Çerezleri</p>
            <p className="leading-7">Tercihlerinizi hatırlayarak kullanım deneyimini kişiselleştirir. Niteliğine göre açık rıza gerekebilir.</p>
            <p className="font-medium">C. Performans ve Analitik Çerezleri</p>
            <p className="leading-7">Trafik ve kullanım davranışı ölçümü için kullanılır. Açık rıza ile çalıştırılır.</p>
            <p className="font-medium">D. Pazarlama ve Hedefleme Çerezleri</p>
            <p className="leading-7">İlgi alanına uygun reklam ve kampanya gösterimi için kullanılır. Açık rıza ile çalıştırılır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">5. Kullandığımız Çerezlere İlişkin Bilgilendirme</h2>
            <p className="leading-7">Sitede kullanılan çerezler birinci taraf veya üçüncü taraf olabilir. Güncel çerez listesi çerez yönetim panelinde gösterilir. Google Analytics, Meta Pixel, Google Ads gibi üçüncü taraf servisler yalnızca sitede gerçekten aktifse bu politikada ve panelde gösterilmelidir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">6. Çerezlerin Hukuki Sebepleri</h2>
            <p className="leading-7">Zorunlu çerezler sözleşmenin ifası, meşru menfaat veya hukuki yükümlülük kapsamında işlenebilir. Analitik, işlevsellik ve pazarlama çerezleri açık rızaya dayanır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">7. Açık Rıza ve Tercih Yönetimi</h2>
            <p className="leading-7">Zorunlu olmayan çerezler yalnızca açık rızanızla etkinleştirilir. Tercihlerinizi çerez banner&apos;ı üzerinden belirleyebilir ve sonradan güncelleyebilirsiniz. Kullanıcıya &ldquo;Hepsini Kabul Et&rdquo;, &ldquo;Hepsini Reddet&rdquo; ve &ldquo;Tercihleri Yönet&rdquo; seçenekleri sunulur.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">8. Çerezleri Nasıl Kontrol Edebilirsiniz?</h2>
            <p className="leading-7">Çerez tercihlerinizi site üzerindeki çerez ayarları bağlantısından veya tarayıcı ayarlarınızdan yönetebilirsiniz. Tarayıcı düzeyinde tüm çerezlerin kapatılması bazı işlevleri etkileyebilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">9. Üçüncü Taraf Çerezler ve Yurt Dışı Aktarım</h2>
            <p className="leading-7">Üçüncü taraf analiz, reklam veya altyapı hizmetleri kullanılması halinde veriler yurt içinde veya yurt dışında işlenebilir. Aktarımlar güncel KVKK hükümlerine uygun yürütülür.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">10. İlgili Kişi Olarak Haklarınız</h2>
            <p className="leading-7">KVKK’nın 11. maddesi kapsamındaki haklarınızı kullanabilirsiniz. Ayrıntılar için KVKK Aydınlatma Metni sayfasını inceleyebilirsiniz.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">11. Politika Değişiklikleri</h2>
            <p className="leading-7">Bu Çerez Politikası, mevzuat değişiklikleri, teknik altyapı güncellemeleri veya hizmet değişiklikleri doğrultusunda güncellenebilir. Güncel metin yayımlandığı tarihten itibaren geçerlidir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">12. İletişim</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Mesut Can (Şahıs İşletmesi)</li>
              <li>Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">13. İlgili Hukuki Metinler</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li><Link href="/kvkk" className="underline-offset-4 hover:underline">KVKK Aydınlatma Metni</Link></li>
              <li><Link href="/gizlilik" className="underline-offset-4 hover:underline">Gizlilik Politikası</Link></li>
              <li><Link href="/kullanim-kosullari" className="underline-offset-4 hover:underline">Kullanım Koşulları</Link></li>
              <li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Mesafeli Satış Sözleşmesi</Link></li>
              <li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Ön Bilgilendirme Formu</Link></li>
              <li><Link href="/iade" className="underline-offset-4 hover:underline">İade / İptal / Cayma Politikası</Link></li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}