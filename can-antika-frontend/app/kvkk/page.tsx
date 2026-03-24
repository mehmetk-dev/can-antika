import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Can Antika KVKK Aydınlatma Metni.",
};

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">KVKK Aydınlatma Metni</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">
            Mesut Can (Şahıs İşletmesi) olarak, canantika.com üzerinden sunduğumuz ürün ve hizmetler kapsamında
            kişisel verilerinizin güvenliğine önem veriyoruz. İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin
            Korunması Kanunu&apos;nun (&quot;KVKK&quot;) 10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak
            Usul ve Esaslar Hakkında Tebliğ kapsamında hazırlanmıştır.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">1. Veri Sorumlusunun Kimliği</h2>
            <p className="leading-7">
              KVKK uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla aşağıda bilgileri yer alan işletme tarafından
              işlenmektedir:
            </p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Veri Sorumlusu: Mesut Can (Şahıs İşletmesi)</li>
              <li>Marka / Site: Can Antika</li>
              <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-5">
            <h2 className="text-xl font-semibold">
              2. Hangi Kişisel Verileri, Hangi Amaçlarla ve Hangi Hukuki Sebeplerle İşliyoruz?
            </h2>

            <div className="space-y-2">
              <p className="font-medium">a) Üyelik ve Hesap Yönetimi</p>
              <p className="leading-7">
                İşlenen Veriler: Ad, soyad, e-posta adresi, telefon numarası, şifre bilgisi (hashlenmiş olarak)
              </p>
              <p className="leading-7">
                Amaç: Üyelik hesabının oluşturulması, oturum açma işlemlerinin yürütülmesi, hesap güvenliğinin
                sağlanması, kullanıcı hesabının yönetilmesi
              </p>
              <p className="leading-7">
                Hukuki Sebep: Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (KVKK m. 5/2-c),
                veri sorumlusunun meşru menfaati (KVKK m. 5/2-f)
              </p>
              <p className="leading-7">Toplama Yöntemi: Web sitesi üyelik formu, giriş ekranları, hesap yönetim sayfaları</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">b) Sipariş, Satış ve Teslimat Süreçleri</p>
              <p className="leading-7">
                İşlenen Veriler: Ad, soyad, teslimat adresi, fatura adresi, telefon numarası, e-posta adresi, sipariş
                bilgileri, ürün detayları, teslimat ve iade kayıtları
              </p>
              <p className="leading-7">
                Amaç: Siparişin alınması, hazırlanması, kargolanması, teslim edilmesi, iade ve iptal süreçlerinin
                yürütülmesi, satış sonrası destek sağlanması, faturalandırma yapılması
              </p>
              <p className="leading-7">
                Hukuki Sebep: Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (KVKK m. 5/2-c),
                veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (KVKK m. 5/2-ç)
              </p>
              <p className="leading-7">Toplama Yöntemi: Sipariş formu, ödeme adımı, müşteri hizmetleri görüşmeleri, e-posta ve telefon kanalları</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">c) Ödeme Süreçleri</p>
              <p className="leading-7">
                İşlenen Veriler: Ödeme işlemine ilişkin sınırlı bilgiler, iade yapılması gereken hallerde banka hesap /
                IBAN bilgisi
              </p>
              <p className="leading-7">
                Amaç: Ödeme işlemlerinin yürütülmesi, iade ödemelerinin gerçekleştirilmesi, işlem güvenliğinin
                sağlanması
              </p>
              <p className="leading-7">
                Hukuki Sebep: Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (KVKK m. 5/2-c),
                veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (KVKK m. 5/2-ç)
              </p>
              <p className="leading-7">Toplama Yöntemi: Ödeme kuruluşu / banka altyapısı, iade süreçlerinde müşteri beyanı</p>
              <p className="leading-7">
                Önemli Bilgilendirme: Ödeme sırasında girilen kart verileri, bankalar veya yetkili ödeme kuruluşları
                tarafından işlenir. Kart bilgileriniz tarafımızca kaydedilmez, saklanmaz veya doğrudan erişilmez.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">d) Müşteri İletişimi ve Destek Süreçleri</p>
              <p className="leading-7">
                İşlenen Veriler: Ad, soyad, telefon numarası, e-posta adresi, destek / şikâyet / talep içerikleri
              </p>
              <p className="leading-7">
                Amaç: Soruların yanıtlanması, destek taleplerinin yönetilmesi, şikâyet süreçlerinin yürütülmesi, satış
                öncesi ve sonrası iletişimin sağlanması
              </p>
              <p className="leading-7">
                Hukuki Sebep: Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (KVKK m. 5/2-c),
                veri sorumlusunun meşru menfaati (KVKK m. 5/2-f)
              </p>
              <p className="leading-7">Toplama Yöntemi: İletişim formu, e-posta, telefon, WhatsApp [yalnızca kullanıyorsanız bırakın]</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">e) Pazarlama ve Ticari İletişim</p>
              <p className="leading-7">
                İşlenen Veriler: Ad, soyad, e-posta adresi, telefon numarası, alışveriş tercihleri, kampanya izin
                kayıtları
              </p>
              <p className="leading-7">
                Amaç: Kampanya ve duyuruların gönderilmesi, yeni ürün ve koleksiyonların tanıtılması, size özel
                tekliflerin sunulması
              </p>
              <p className="leading-7">Hukuki Sebep: Açık rıza (KVKK m. 5/1)</p>
              <p className="leading-7">Toplama Yöntemi: E-bülten üyeliği, kampanya izin kutuları, açık rıza alınan formlar</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">f) Web Sitesi Güvenliği ve Teknik Süreçler</p>
              <p className="leading-7">
                İşlenen Veriler: IP adresi, tarih-saat bilgisi, erişim logları, tarayıcı bilgisi, cihaz bilgisi, çerez
                verileri, hata kayıtları
              </p>
              <p className="leading-7">
                Amaç: Site güvenliğinin sağlanması, dolandırıcılık ve kötüye kullanımın önlenmesi, sistem performansının
                izlenmesi, teknik hataların giderilmesi
              </p>
              <p className="leading-7">
                Hukuki Sebep: Veri sorumlusunun meşru menfaati (KVKK m. 5/2-f), veri sorumlusunun hukuki yükümlülüğünü
                yerine getirmesi (KVKK m. 5/2-ç)
              </p>
              <p className="leading-7">Toplama Yöntemi: Sunucu logları, çerezler, güvenlik sistemleri, otomatik teknik kayıt mekanizmaları</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">g) Antika Ürünlere İlişkin Belgeleme ve Satış Sonrası İspat Süreçleri</p>
              <p className="leading-7">
                İşlenen Veriler: Ad, soyad, satın alma bilgileri, ürün açıklamaları, ürün görselleri, ürün kondisyon /
                nitelik kayıtları, talep halinde ekspertiz veya belge sürecine ilişkin bilgiler
              </p>
              <p className="leading-7">
                Amaç: Ürün özelliklerinin kayıt altına alınması, satış sonrası ispat süreçlerinin yürütülmesi, ürün
                açıklamalarının doğrulanması, talep halinde ekspertiz / belgeleme süreçlerinin yürütülmesi
              </p>
              <p className="leading-7">
                Hukuki Sebep: Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması (KVKK m.
                5/2-e), veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi (KVKK m. 5/2-ç)
              </p>
              <p className="leading-7">Toplama Yöntemi: Sipariş ve satış kayıtları, müşteri talepleri, ürün belgeleme süreçleri</p>
            </div>

            <p className="leading-7">
              T.C. kimlik numarası gibi ek veriler yalnızca mevzuat gerektiriyorsa veya somut işlem için gerçekten
              zorunluysa işlenir. Rutin müşteri işlemleri için genel kural olarak talep edilmez.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">3. Kişisel Verilerin Kimlere ve Hangi Amaçlarla Aktarılabileceği</h2>
            <p className="leading-7">
              Kişisel verileriniz, KVKK&apos;nın 8. ve 9. maddelerine uygun olarak, aşağıdaki alıcı gruplarına ve belirtilen
              amaçlarla aktarılabilir:
            </p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Kargo ve lojistik firmalarına: Siparişlerin teslim edilmesi ve kargo takibinin yapılması amacıyla ad, soyad, adres ve telefon bilgileri</li>
              <li>Bankalara ve ödeme kuruluşlarına: Ödeme işlemlerinin gerçekleştirilmesi, 3D Secure doğrulama ve iade süreçlerinin yürütülmesi amacıyla işlem bilgileri</li>
              <li>Muhasebe, mali müşavirlik ve e-fatura/e-arşiv hizmet sağlayıcılarına: Muhasebe, faturalandırma ve vergi yükümlülüklerinin yerine getirilmesi amacıyla kimlik ve işlem bilgileri</li>
              <li>Yetkili kamu kurum ve kuruluşlarına: Mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi veya usulüne uygun resmi talep bulunması halinde gerekli bilgiler</li>
              <li>Sigorta şirketlerine: Yalnızca sigortalanması talep edilen veya gerekli görülen yüksek değerli ürünlere ilişkin işlemlerde gerekli minimum bilgiler</li>
              <li>Uzman / ekspertiz / restorasyon hizmeti sağlayıcılarına: Yalnızca bu yönde hizmet talebi bulunması halinde, talep konusu ürün bilgileri ve gerekli iletişim verileri</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">4. Yurt Dışına Veri Aktarımı</h2>
            <p className="leading-7">
              Bu bölüm yalnızca fiilen yurt dışı servis kullanıyorsanız yayımlanmalıdır. Kullandığımız bazı e-posta,
              bulut bilişim, güvenlik, analitik veya barındırma hizmetlerinin yurt dışında bulunması halinde kişisel
              verileriniz, KVKK&apos;nın 9. maddesinde öngörülen kurallara uygun olarak yurt dışına aktarılabilir.
            </p>
            <p className="leading-7">
              Yurt dışı aktarım gereken durumlarda, yürürlükteki mevzuat uyarınca yeterlilik kararı, uygun güvence,
              standart sözleşme veya ilgili diğer hukuki mekanizmalar esas alınır.
            </p>
            <p className="leading-7">
              Google, Meta, Cloudflare, Vercel, Microsoft, yabancı barındırma ya da yabancı e-posta servisleri
              kullanıyorsan bu bölümü bırak. Tamamen yerli altyapı kullanıyorsan çıkar.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">5. Kişisel Veri Toplama Yöntemleri</h2>
            <p className="leading-7">Kişisel verileriniz;</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>web sitesi üyelik ve sipariş formları,</li>
              <li>iletişim formu,</li>
              <li>e-posta ve telefon görüşmeleri,</li>
              <li>ödeme kuruluşu / banka altyapıları,</li>
              <li>çerezler ve teknik sistemler,</li>
              <li>müşteri destek süreçleri,</li>
              <li>kargo ve teslimat organizasyonları</li>
            </ul>
            <p className="leading-7">vasıtasıyla elektronik veya fiziki ortamda toplanabilmektedir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">6. KVKK Kapsamındaki Haklarınız</h2>
            <p className="leading-7">KVKK&apos;nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
              <li>KVKK&apos;nın 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">7. Başvuru Yöntemi</h2>
            <p className="leading-7">KVKK kapsamındaki taleplerinizi, ilgili mevzuata uygun olarak aşağıdaki yöntemlerle bize iletebilirsiniz:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Islak imzalı dilekçe ile, yukarıda belirtilen adrese şahsen veya noter / iadeli taahhütlü posta yoluyla</li>
              <li>Varsa kayıtlı elektronik posta (KEP) adresiniz üzerinden</li>
              <li>Güvenli elektronik imza veya mobil imza kullanarak</li>
              <li>Daha önce tarafımıza bildirilen ve sistemimizde kayıtlı bulunan e-posta adresiniz üzerinden</li>
              <li>Başvuruya özel geliştirilmiş bir sistem bulunuyorsa bu sistem üzerinden</li>
            </ul>
            <p className="leading-7">E-posta ile başvurular için iletişim adresimiz: destek@canantika.com</p>
            <p className="leading-7">
              Başvurularınız, talebin niteliğine göre en kısa sürede ve en geç 30 gün içinde ücretsiz olarak
              sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi halinde, Kişisel Verileri Koruma Kurulu
              tarafından belirlenen tarifedeki ücret talep edilebilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">8. İletişim</h2>
            <p className="leading-7">
              Kişisel verilerinizin işlenmesine ilişkin her türlü soru ve başvurunuz için bizimle iletişime geçebilirsiniz:
            </p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Mesut Can (Şahıs İşletmesi)</li>
              <li>Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">9. İlgili Hukuki Metinler</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>
                <Link href="/gizlilik" className="underline-offset-4 hover:underline">Gizlilik Politikası</Link>
              </li>
              <li>
                <Link href="/cerezler" className="underline-offset-4 hover:underline">Çerez Politikası</Link>
              </li>
              <li>
                <Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Mesafeli Satış Sözleşmesi</Link>
              </li>
              <li>
                <Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Ön Bilgilendirme Formu</Link>
              </li>
              <li>
                <Link href="/iade" className="underline-offset-4 hover:underline">İade / İptal / Cayma Politikası</Link>
              </li>
              <li>
                <Link href="/kullanim-kosullari" className="underline-offset-4 hover:underline">Kullanım Koşulları</Link>
              </li>
            </ul>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
