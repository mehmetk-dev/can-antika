import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İade / İptal / Cayma Politikası",
  description: "Can Antika İade / İptal / Cayma Politikası.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">İade / İptal / Cayma Politikası</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">
            Can Antika olarak müşteri memnuniyetine önem veriyoruz. Bu politika, www.canantika.com üzerinden satın
            alınan ürünlere ilişkin cayma hakkı, iade, iptal ve ayıplı ürün süreçlerini düzenlemek amacıyla
            hazırlanmıştır.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">1. Cayma Hakkı</h2>
            <p className="leading-7">
              Tüketici, satın aldığı ürünü teslim aldığı tarihten itibaren 14 gün içinde, herhangi bir gerekçe
              göstermeksizin ve cezai şart ödemeksizin iade etme hakkına sahiptir. Ürün henüz teslim edilmemişse,
              teslimata kadar olan sürede de cayma hakkı kullanılabilir.
            </p>
            <p className="leading-7">
              Cayma hakkının kullanılması için bu süre içinde tarafımıza açık bir bildirim yapılması yeterlidir.
            </p>
            <p className="leading-7">İletişim Bilgileri:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>Telefon: +90 507 687 92 15</li>
              <li>E-posta: destek@canantika.com</li>
            </ul>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">2. Cayma Hakkının Kullanımı</h2>
            <p className="leading-7">
              Cayma hakkınızı kullanmak için, 14 günlük süre içinde telefon veya e-posta yoluyla bizimle iletişime
              geçerek iade talebinizi bildirmeniz gerekir.
            </p>
            <p className="leading-7">
              Cayma bildiriminizin ardından, ürünü bildirim tarihinden itibaren 10 gün içinde tarafımıza geri
              göndermeniz gerekmektedir. Satıcı olarak biz de cayma bildiriminin tarafımıza ulaştığı tarihten itibaren
              14 gün içinde tahsil edilen ödemeleri iade etmekle yükümlüyüz. Ancak iade, ürünün tarafımıza ulaşması
              veya tüketici tarafından geri gönderildiğinin ispat edilmesi beklenerek yapılabilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">3. İade Koşulları</h2>
            <p className="leading-7">
              İade edilecek ürünün mümkünse eksiksiz şekilde, varsa birlikte gönderilen belge, sertifika, fatura ve ek
              parçalarıyla birlikte gönderilmesi gerekir.
            </p>
            <p className="leading-7">
              Bununla birlikte, cayma hakkının kullanılması için ürünün mutlaka hiç açılmamış, hiç dokunulmamış veya
              hiç incelenmemiş olması şart değildir. Tüketici, ürünü niteliğine, özelliklerine ve işleyişine uygun
              şekilde makul ölçüde inceleyebilir. Cayma süresi içinde malın mutat kullanımı sebebiyle meydana gelen
              değişiklik ve bozulmalardan tüketici sorumlu değildir.
            </p>
            <p className="leading-7">Ancak aşağıdaki haller ayrıca değerlendirilir:</p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>ürünün tüketici tarafından olağan inceleme sınırını aşacak şekilde kullanılması,</li>
              <li>ürünün zarar görmesi, eksiltilmesi veya değiştirilmesi,</li>
              <li>birlikte verilen sertifika, belge veya ayırt edici unsurların kaybedilmesi,</li>
              <li>ürüne sonradan müdahale edilmesi, restore edilmesi veya yapısının değiştirilmesi.</li>
            </ul>
            <p className="leading-7">
              Antika ürünlerde yaş, dönem, patina, yüzey izleri ve ürün açıklamasında önceden belirtilmiş kondisyon
              unsurları ayrıca dikkate alınır.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">4. İade Edilemeyecek Durumlar</h2>
            <p className="leading-7">
              Mesafeli satış mevzuatında yer alan cayma hakkı istisnaları saklıdır. Ayrıca aşağıdaki durumlar iade
              değerlendirmesinde dikkate alınabilir:
            </p>
            <ul className="list-disc space-y-1 pl-6 leading-7">
              <li>tüketicinin özel isteği doğrultusunda özel olarak restore edilen veya kişiselleştirilen ürünler,</li>
              <li>siparişe özel hazırlanan veya üzerinde özel işlem yapılan ürünler,</li>
              <li>ürünün niteliği gereği tekrar satışa uygun olmayacak şekilde değiştirilmiş olması,</li>
              <li>mevzuat gereği cayma hakkı dışında kalan diğer haller.</li>
            </ul>
            <p className="leading-7">
              “Özel sipariş” veya “müzayede ürünü” ifadelerini yalnızca sitende gerçekten böyle bir satış modeli varsa
              kullanman daha doğru olur. Aksi halde bu ifadeler gereksiz yere geniş kalır.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">5. İade Kargo Süreci</h2>
            <p className="leading-7">
              Cayma hakkı kapsamında yapılacak iadelerde kargo masrafı, ön bilgilendirme metninde belirtilen taşıyıcı
              ve şartlara göre belirlenir.
            </p>
            <p className="leading-7">
              Satıcı, ön bilgilendirmede cayma halinde kullanılacak anlaşmalı taşıyıcıyı belirtmişse ve ürün bu taşıyıcı
              ile gönderilmişse, tüketici iadeye ilişkin masraflardan sorumlu tutulamaz. Ön bilgilendirmede böyle bir
              taşıyıcı belirtilmemişse de tüketiciden iade masrafı talep edilemez. Belirtilen taşıyıcının tüketicinin
              bulunduğu yerde şubesi yoksa, satıcı ilave masraf talep etmeksizin ürünü tüketiciden almakla yükümlüdür.
            </p>
            <p className="leading-7">
              Bu nedenle sitede ayrıca Ön Bilgilendirme Formu içinde iade taşıyıcısının net yazılması gerekir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">6. Geri Ödeme</h2>
            <p className="leading-7">
              Cayma hakkının usulüne uygun kullanılması halinde, ürün bedeli ve tahsil edilmişse teslimat dahil ilgili
              ödemeler, cayma bildiriminin tarafımıza ulaştığı tarihten itibaren 14 gün içinde iade edilir. İade,
              tüketicinin satın alma sırasında kullandığı ödeme aracına uygun şekilde ve tüketiciye ek maliyet
              yüklenmeden yapılır.
            </p>
            <p className="leading-7">
              Bankaların iç işlem süreleri nedeniyle tutarın kartınıza veya hesabınıza yansıması ayrıca birkaç gün
              sürebilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">7. Ayıplı veya Hasarlı Ürünler</h2>
            <p className="leading-7">
              Teslim edilen ürünün ayıplı, eksik, kırık veya açıklamada belirtilenden farklı olduğu düşünülüyorsa,
              durumun mümkün olan en kısa sürede tarafımıza bildirilmesi gerekir.
            </p>
            <p className="leading-7">
              Ayıplı mal halinde tüketicinin, 6502 sayılı Kanun kapsamındaki seçimlik hakları saklıdır. Bunlar somut
              olaya göre sözleşmeden dönme, bedelde indirim, ücretsiz onarım veya mümkünse ayıpsız misliyle değişim
              olabilir. Tekil antika ürünlerde birebir değişim her zaman mümkün olmayabileceğinden, diğer yasal haklar
              ayrıca değerlendirilir.
            </p>
            <p className="leading-7">
              Teslimat sırasında kargo paketinde açık hasar görülüyorsa, kargo görevlisi ile birlikte tutanak tutulması
              faydalıdır. Ancak tutanak tutulmamış olması tek başına tüm hakların kaybı anlamına gelmez. Bu nedenle
              “tutanaksız hiçbir hasar kabul edilmez” gibi kesin bir ifade kullanmaman daha güvenlidir. Bu yaklaşım,
              teslimata kadar oluşan kayıp ve hasardan kural olarak satıcının sorumlu olduğu genel tüketici rejimiyle de
              uyumludur.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">8. Sipariş İptali</h2>
            <p className="leading-7">
              Sipariş, ürün henüz kargoya verilmeden önce iptal edilebilir. İptal talebi için bizimle telefon veya
              e-posta üzerinden iletişime geçebilirsiniz.
            </p>
            <p className="leading-7">
              Siparişin iptal edilmesi halinde, tahsil edilen tutar ödeme yöntemine göre uygun süre içinde iade edilir.
              Banka ve ödeme kuruluşlarının işlem süreleri ayrıca uygulanabilir.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">9. Antika Ürünlere İlişkin Özel Not</h2>
            <p className="leading-7">
              Can Antika&apos;da satışa sunulan ürünlerin önemli bir bölümü tekil, dönemsel ve yaşa bağlı izler taşıyan
              ürünlerden oluşabilir. Bu nedenle ürün açıklamalarında belirtilen kondisyon, patina, yüzey izleri, eski
              kullanım izleri, onarım veya restorasyon bilgileri iade değerlendirmesinde dikkate alınır.
            </p>
            <p className="leading-7">
              Ürün açıklamasında açıkça belirtilmiş doğal yaş izleri veya dönemsel özellikler, tek başına ayıp olarak
              değerlendirilmez; buna karşılık açıklamada yer almayan önemli kusurlar ayrıca incelenir. Bu yaklaşım,
              tüketicinin sözleşme kurulurken bildiği veya bilmesinin beklendiği nitelikler bakımından ayrıca önem
              taşır.
            </p>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="text-xl font-semibold">10. İletişim</h2>
            <p className="leading-7">
              İade, iptal, cayma hakkı veya ayıplı ürün başvurularınız için bizimle iletişime geçebilirsiniz:
            </p>
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