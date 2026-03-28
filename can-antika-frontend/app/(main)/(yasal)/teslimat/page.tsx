import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teslimat / Kargo Politikası",
  description: "Can Antika Teslimat / Kargo Politikası.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Teslimat / Kargo Politikası</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">
            Can Antika olarak, satışa sunduğumuz ürünlerin niteliğine uygun şekilde özenli paketleme ve güvenli
            teslimat süreci yürütmeyi hedefliyoruz. Bu politika, www.canantika.com üzerinden verilen siparişlere
            ilişkin teslimat ve kargo esaslarını düzenlemek amacıyla hazırlanmıştır.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">1. Teslimat Kapsamı</h2>
            <p className="leading-7">
              Siparişler, sipariş sırasında alıcı tarafından bildirilen teslimat adresine gönderilir. Türkiye genelinde
              teslimat yapılabilmesi hedeflenmektedir. Ancak bazı büyük hacimli, hassas, özel taşıma gerektiren veya
              bölgesel lojistik kısıtı bulunan ürünlerde teslimat koşulları ayrıca değişebilir.
            </p>
            <p className="leading-7">
              İstanbul içi özel kurye, mağazadan teslim alma veya farklı teslimat modelleri sunuluyorsa, bunlara ilişkin
              bilgiler sipariş öncesinde ayrıca belirtilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">2. Teslimat Süresi</h2>
            <p className="leading-7">
              Siparişler, ürünün niteliğine, paketleme ihtiyacına, teslimat bölgesine, yoğunluk durumuna ve taşıyıcı
              firmanın çalışma şartlarına göre değişen sürelerde teslim edilir.
            </p>
            <p className="leading-7">
              Sipariş öncesinde belirli bir teslimat süresi taahhüt edilmişse, teslimat bu süre içinde gerçekleştirilir.
              Belirli bir süre ayrıca taahhüt edilmemişse, mesafeli satış mevzuatı kapsamında ürünün en geç 30 gün içinde
              teslim edilmesi esastır.
            </p>
            <p className="leading-7">
              Aynı gün teslimat, hızlı teslimat veya özel sevkiyat gibi seçenekler yalnızca ilgili sipariş ve bölge için
              fiilen sunuluyorsa geçerlidir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">3. Kargo Ücreti</h2>
            <p className="leading-7">
              Kargo ücreti; sipariş tutarı, ürünün hacmi, ağırlığı, kırılganlığı, teslimat bölgesi ve seçilen taşıma
              yöntemine göre değişebilir.
            </p>
            <p className="leading-7">
              Belirli sipariş tutarının üzerindeki alışverişlerde ücretsiz kargo, sabit hızlı teslimat ücreti veya
              mağazadan ücretsiz teslim alma gibi kampanya ve uygulamalar varsa, bunlar sipariş sırasında ayrıca
              gösterilir.
            </p>
            <p className="leading-7">
              Bu nedenle, “500 TL üzeri ücretsiz kargo” veya “hızlı teslimat 50 TL” gibi sabit ifadeler yalnızca
              gerçekten aktif ve istikrarlı şekilde uygulanıyorsa kullanılmalıdır.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">4. Paketleme</h2>
            <p className="leading-7">
              Antika, koleksiyonluk veya kırılgan ürünler, ürünün yapısına uygun biçimde özenle paketlenir. Ürünün
              niteliğine göre aşağıdaki türden koruyucu önlemler kullanılabilir:
            </p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>koruyucu ambalaj ve destekleyici dolgu malzemeleri,</li>
              <li>hava yastıklı veya köpük destekli iç paketleme,</li>
              <li>çift katmanlı kutulama,</li>
              <li>büyük veya hassas ürünlerde güçlendirilmiş dış ambalaj,</li>
              <li>gerekli görülen hallerde özel taşıma çözümleri.</li>
            </ul>
            <p className="leading-7">
              Kullanılacak paketleme yöntemi, ürünün ölçüsüne, hassasiyetine ve taşıma riskine göre değişebilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">5. Teslimat Sırasında Sorumluluk</h2>
            <p className="leading-7">
              Mesafeli satışlarda malın tüketiciye veya tüketicinin belirlediği üçüncü kişiye teslimine kadar oluşan
              kayıp ve hasardan kural olarak satıcı sorumludur. Ancak tüketici, satıcının belirlediği taşıyıcı dışında
              başka bir taşıyıcı ile gönderim talep etmişse, ilgili taşıyıcıya teslimden sonraki kayıp veya hasardan
              satıcının sorumluluğu sınırlanabilir.
            </p>
            <p className="leading-7">
              Teslimat sırasında pakette açık bir ezilme, yırtılma, kırılma veya ıslanma görülmesi halinde, durumun
              taşıyıcı firma görevlisi ile birlikte kontrol edilmesi ve mümkünse tutanak altına alınması tavsiye edilir.
              Bununla birlikte tutanak tutulmamış olması, tüketicinin kanundan doğan tüm haklarını kendiliğinden ortadan
              kaldırmaz. Ayıplı mal değerlendirmesinde yasal hükümler ayrıca uygulanır.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">6. Sigortalı Taşıma</h2>
            <p className="leading-7">
              Ürünün niteliğine, değerine ve kırılganlığına göre uygun görülen gönderilerde sigortalı taşıma veya ek
              güvenlik önlemleri tercih edilebilir.
            </p>
            <p className="leading-7">
              Ancak tüm siparişlerin otomatik olarak “tam değer üzerinden sigortalı” gönderildiği yalnızca gerçekten
              böyle bir uygulama varsa belirtilmelidir. Aksi halde bu konuda genel ve sınırsız bir taahhüt verilmez.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">7. Mağazadan Teslim Alma</h2>
            <p className="leading-7">
              Mağazadan teslim alma seçeneği sunuluyorsa, siparişin hazır olduğuna ilişkin bilgilendirme yapıldıktan sonra
              ürün mağazadan teslim alınabilir.
            </p>
            <p className="leading-7">Mağaza Adresi:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
            </ul>
            <p className="leading-7 text-sm text-muted-foreground italic">Mağazadan teslim alma seçeneği mevcut değilse bu bölüm kaldırılmalıdır.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">8. Mücbir Sebepler ve Gecikmeler</h2>
            <p className="leading-7">
              Doğal afet, olumsuz hava koşulları, resmi makam kararları, taşıyıcı firma kaynaklı aksaklıklar, yoğun
              dönemler, grev, savaş, salgın, siber saldırı, teknik arıza veya benzeri olağanüstü durumlar teslimat
              sürelerini etkileyebilir.
            </p>
            <p className="leading-7">Bu gibi durumlarda kullanıcı mümkün olan en kısa sürede bilgilendirilir.</p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">9. İletişim</h2>
            <p className="leading-7">Teslimat ve kargo süreçlerine ilişkin sorularınız için bizimle iletişime geçebilirsiniz:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Mesut Can (Şahıs İşletmesi)</li>
              <li>Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li>
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}