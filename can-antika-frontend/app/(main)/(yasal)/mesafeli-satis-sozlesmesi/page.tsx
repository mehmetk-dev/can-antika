import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Can Antika Mesafeli Satış Sözleşmesi.",
};

export default function DistanceSalesContractPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mesafeli Satış Sözleşmesi</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">Madde 1 — Taraflar</h2>
            <p className="font-medium">SATICI</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Adı / Unvanı: Mesut Can (Şahıs İşletmesi)</li>
              <li>Marka: Can Antika</li>
              <li>Web Sitesi: www.canantika.com</li>
              <li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
            <p className="font-medium">ALICI (TÜKETİCİ)</p>
            <p className="leading-7">Alıcı’ya ilişkin ad-soyad, teslimat adresi, fatura adresi, telefon ve e-posta bilgileri sipariş sırasında sisteme girilen bilgilerden oluşur. Alıcı, siparişi onaylayarak işbu sözleşmeyi kabul etmiş sayılır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 2 — Sözleşmenin Konusu</h2>
            <p className="leading-7">İşbu sözleşmenin konusu, ALICI’nın SATICI’ya ait www.canantika.com internet sitesi üzerinden elektronik ortamda sipariş verdiği ürünün satışı ve teslimine ilişkin olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>
            <p className="leading-7">Satışa sunulan ürünler antika, koleksiyonluk veya dekoratif nitelikli tekil parçalar olabilir. Bu nedenle bazı ürünlerin birebir aynısının tekrar temin edilmesi mümkün olmayabilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 3 — Ürün Bilgileri</h2>
            <p className="leading-7">Sözleşme konusu ürünün adı ve temel nitelikleri; türü, materyali, ölçüsü, dönemi ve kondisyon bilgileri; varsa restorasyon/onarım bilgileri; satış fiyatı ve vergiler dahil toplam bedeli; teslimat ve varsa ek masrafları ile ödeme yöntemi sipariş özeti ekranında ve sipariş onayında yer alır.</p>
            <p className="leading-7">Ürün sayfasındaki fotoğraflar esasen ürünün gerçek görsellerini göstermeyi amaçlar. Ekran, ışık ve cihaz farklılıkları nedeniyle ton farkları oluşabilir. Antika ürünlerde yaşa bağlı patina ve doğal kullanım belirtileri, açıklamada belirtildiği ölçüde tek başına ayıp sayılmaz.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 4 — Fiyat, Ödeme ve Sipariş Onayı</h2>
            <p className="leading-7">Ürün fiyatları aksi belirtilmedikçe Türk Lirası (₺) cinsindendir. Ödeme, sitede fiilen sunulan yöntemlerle yapılır. Kart verileri ödeme kuruluşu/banka altyapısı üzerinden işlenir; satıcı tarafından saklanmaz.</p>
            <p className="leading-7">ALICI, siparişi onayladığında ödeme yükümlülüğü altına girdiğini kabul eder. Sözleşme bedeli dışında ilave ödeme doğuracak seçenekler yalnızca tüketicinin açık onayıyla tahsil edilebilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 5 — Teslimat</h2>
            <p className="leading-7">Ürün, ALICI’nın sipariş sırasında bildirdiği teslimat adresine gönderilir. Satıcı, özel bir süre taahhüdü yoksa ürünü en geç 30 gün içinde teslim etmekle yükümlüdür.</p>
            <p className="leading-7">Malın tüketiciye teslimine kadar oluşan kayıp ve hasardan kural olarak satıcı sorumludur. Tüketici satıcının belirlediği taşıyıcı dışında farklı taşıyıcı talep etmişse, ilgili aşamadaki sorumluluk mevzuat kapsamında ayrıca değerlendirilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 6 — Cayma Hakkı</h2>
            <p className="leading-7">ALICI, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren 14 gün içinde, gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Malın teslimine kadar da cayma hakkı kullanılabilir.</p>
            <p className="leading-7">Cayma bildirimi için yazılı beyan veya kalıcı veri saklayıcısı yeterlidir. Bildirim adresi: destek@canantika.com</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 7 — İade Kargo Masrafı</h2>
            <p className="leading-7">Ön bilgilendirmede anlaşmalı iade taşıyıcısı belirtilmişse ve iade bu taşıyıcıyla yapılıyorsa tüketici iade kargo masrafından sorumlu tutulamaz. Ön bilgilendirmede taşıyıcı belirtilmemişse tüketiciden iade masrafı talep edilemez.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 8 — Cayma Hakkının Kullanılamayacağı Haller</h2>
            <p className="leading-7">Mesafeli Sözleşmeler Yönetmeliği’nde düzenlenen istisnalar saklıdır. Tüketicinin özel isteklerine göre hazırlanan ürünler ve mevzuatta cayma dışında bırakılan diğer haller bu kapsamdadır.</p>
            <p className="leading-7">Antika ürünlerde yalnızca yaşa bağlı doğal izler veya önceden açıklanmış kondisyon unsurları tek başına cayma hakkını ortadan kaldırmaz.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 9 — Ayıplı Ürün ve Tüketicinin Seçimlik Hakları</h2>
            <p className="leading-7">Ayıplı teslim halinde tüketicinin 6502 sayılı Kanun kapsamındaki seçimlik hakları saklıdır. Tekil ürün yapısı nedeniyle ayıpsız misliyle değişim her zaman mümkün olmayabilir; diğer yasal haklar saklıdır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 10 — Antika Ürünler, Belgeleme ve Mevzuata Uyum</h2>
            <p className="leading-7">Gerekmesi halinde müze müdürlüğü, belge, devir ve bildirim süreçleri dahil ilgili kültür varlığı mevzuatı uygulanır. Ürünle sunulan orijinallik/kondisyon belgeleri satış kapsamı bakımından esastır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 11 — İfanın İmkânsızlaşması</h2>
            <p className="leading-7">Edimin ifasının imkânsızlaştığı hallerde satıcı, durumu 3 gün içinde alıcıya bildirir ve tahsil edilen ödemeleri bildirim tarihinden itibaren en geç 14 gün içinde iade eder.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 12 — Uyuşmazlık Çözümü</h2>
            <p className="leading-7">İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Parasal sınırlara göre Tüketici Hakem Heyeti veya Tüketici Mahkemesi yetkilidir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">Madde 13 — Elektronik Kayıtlar ve Yürürlük</h2>
            <p className="leading-7">Taraflar, mevzuatın izin verdiği ölçüde sipariş kayıtları, sistem logları, elektronik onay kayıtları ve yazışmaların delil olarak dikkate alınabileceğini kabul eder. Sözleşme, ALICI tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">İlgili Hukuki Metinler</h2>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Ön Bilgilendirme Formu</Link></li>
              <li><Link href="/iade" className="underline-offset-4 hover:underline">İade / İptal / Cayma Politikası</Link></li>
              <li><Link href="/teslimat" className="underline-offset-4 hover:underline">Teslimat / Kargo Politikası</Link></li>
              <li><Link href="/kvkk" className="underline-offset-4 hover:underline">KVKK Aydınlatma Metni</Link></li>
              <li><Link href="/gizlilik" className="underline-offset-4 hover:underline">Gizlilik Politikası</Link></li>
              <li><Link href="/cerezler" className="underline-offset-4 hover:underline">Çerez Politikası</Link></li>
              <li><Link href="/kullanim-kosullari" className="underline-offset-4 hover:underline">Kullanım Koşulları</Link></li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}