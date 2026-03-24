import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Can Antika Kullanım Koşulları.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-10 md:py-14">
        <article className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Kullanım Koşulları</h1>
          <p className="mt-3 text-sm text-muted-foreground">Son Güncelleme: 23 Mart 2026</p>

          <p className="mt-6 leading-7">Bu Kullanım Koşulları, www.canantika.com alan adlı internet sitesinin kullanımına ilişkin hüküm ve şartları düzenler. Siteyi ziyaret eden, üye olan veya alışveriş yapan her kullanıcı, işbu metni okuduğunu, anladığını ve kabul ettiğini beyan eder.</p>
          <p className="leading-7">Bu metin, site kullanımı ve genel kuralları düzenler. Ürün satın alma süreçlerinde ayrıca Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi, İade / İptal / Cayma Politikası, KVKK Aydınlatma Metni, Gizlilik Politikası ve Çerez Politikası hükümleri de uygulanır.</p>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">1. Taraflar ve Site Bilgisi</h2><ul className="list-disc space-y-1 pl-6 leading-7"><li>Satıcı / İşletme: Mesut Can (Şahıs İşletmesi)</li><li>Marka: Can Antika</li><li>İnternet Sitesi: www.canantika.com</li><li>Adres: Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li><li>Telefon: +90 507 687 92 15</li><li>E-posta: destek@canantika.com</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">2. Tanımlar</h2><p className="leading-7">Bu metinde geçen: Site, Satıcı, Kullanıcı, Üye, Ürün, Sipariş ve Kondisyon kavramları; www.canantika.com üzerindeki hizmetleri, tarafları ve satışa konu antika/koleksiyon ürünlerine ilişkin tanımları ifade eder.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">3. Konu ve Kapsam</h2><p className="leading-7">İşbu Kullanım Koşulları; sitenin kullanımı, üyelik, içerik kullanımı, sipariş süreciyle bağlantılı genel ilkeler, yasaklı kullanımlar, fikri mülkiyet, sorumluluk sınırları ve iletişim esaslarını düzenler.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">4. Hizmet Tanımı</h2><p className="leading-7">Can Antika, antika ve koleksiyon ürünü niteliği taşıyan ürünlerin çevrimiçi tanıtımını ve satışını yapar. Hizmet kapsamında ürünlerin sergilenmesi/satışı, kondisyon ve materyal bilgilerinin paylaşılması, sipariş/teslimat/destek süreçleri ile talep halinde ek görsel veya açıklama paylaşımı sağlanabilir.</p><p className="leading-7">Satışa sunulan ürünlerin önemli bir kısmı tekil / eşsiz parça niteliğinde olabilir. Bu nedenle aynı ürünün tekrar stoklanması her zaman mümkün olmayabilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">5. Site Kullanımına İlişkin Genel Esaslar</h2><p className="leading-7">Kullanıcı, siteyi kullanırken yürürlükteki mevzuata, genel ahlaka, dürüstlük kurallarına ve işbu Kullanım Koşulları&apos;na uygun hareket etmeyi kabul eder.</p><ul className="list-disc space-y-1 pl-6 leading-7"><li>Siteye verdiği bilgilerin doğru, güncel ve eksiksiz olduğunu,</li><li>Başkalarına ait yanlış, yanıltıcı veya hukuka aykırı bilgi kullanmayacağını,</li><li>Site güvenliğini tehlikeye sokacak işlem yapmayacağını,</li><li>Site altyapısına zarar verecek yazılım, bot, script veya otomasyon kullanmayacağını,</li><li>Başka kullanıcı hesaplarına yetkisiz erişim sağlamayacağını,</li><li>Siteyi hukuka aykırı, aldatıcı veya ticari itibarı zedeleyici biçimde kullanmayacağını kabul eder.</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">6. Üyelik</h2><p className="leading-7">Site üzerinden alışveriş, üye olarak veya teknik altyapının izin verdiği ölçüde misafir kullanıcı modeliyle gerçekleştirilebilir. Üyelik sistemi kullanılması halinde; doğru bilgi verme, hesap/şifre güvenliği, hesabın üçüncü kişilerle paylaşılmaması yükümlülükleri geçerlidir.</p><p className="leading-7">Satıcı; sahtecilik şüphesi, hukuka aykırı kullanım, ödeme güvenliği riski, kötüye kullanım veya koşullara aykırılık halinde üyeliği askıya alabilir ya da sonlandırabilir. Devam eden siparişler ve doğmuş haklar saklıdır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">7. Ürün Bilgileri, Görseller ve Kondisyon Açıklamaları</h2><p className="leading-7">Ürün açıklamaları ve görseller mümkün olan en doğru şekilde sunulur. Antika ürünlerin doğası gereği patina, yüzey aşınması, ton farkı, kullanım izleri ve dönemsel işçilik farklılıkları her zaman kusur sayılmaz.</p><p className="leading-7">Renk/ölçü farklılıkları ekran ve üretim/yaş etkileri nedeniyle sınırlı düzeyde oluşabilir. Kullanıcı, satın almadan önce ürün açıklamalarını dikkatle incelemekle yükümlüdür.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">8. Sipariş, Stok ve Fiyatlandırma</h2><p className="leading-7">Fiyatlar aksi belirtilmedikçe Türk Lirası cinsindendir. Sepete ekleme tek başına rezervasyon garantisi sağlamaz. Tekil ürünlerde ilk başarıyla tamamlanan sipariş esas alınabilir.</p><p className="leading-7">Açık fiyat hatası, teknik arıza, mükerrer satış, fiili imkânsızlık, hukuki engel veya kötüye kullanım şüphesinde sipariş iptal edilebilir; tahsil edilen bedel iade edilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">9. Ödeme</h2><p className="leading-7">Ödeme yöntemleri sitede fiilen sunulan seçeneklerle sınırlıdır. Kart verileri ödeme kuruluşu/banka altyapısında işlenir, satıcı tarafından saklanmaz. Havale/EFT siparişlerinde işlem ödemenin hesaba geçmesiyle başlatılır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">10. Teslimat</h2><p className="leading-7">Teslimat süresi ürün niteliği, lokasyon, paketleme ve taşıma gereksinimine göre değişebilir. Mücbir sebepler veya üçüncü taraf gecikmeleri teslimatı etkileyebilir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">11. Cayma Hakkı, İade ve İptal</h2><p className="leading-7">Bu süreçler, ayrıca yayımlanan İade / İptal / Cayma Politikası ile Mesafeli Satış Sözleşmesi hükümlerine tabidir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">12. Kültürel Miras ve Mevzuata Uyum</h2><p className="leading-7">Satışa sunulan ürünlerde yürürlükteki kültür varlığı mevzuatına uygun hareket edilmesi amaçlanır. Tescil/bildirim/devir gibi zorunlu süreçler mevzuata göre ayrıca yürütülür.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">13. Fikri Mülkiyet Hakları</h2><p className="leading-7">Sitedeki metin, görsel, logo, tasarım, yazılım ve veri tabanı hakları aksi belirtilmedikçe Can Antika’ya veya hak sahiplerine aittir. İzinsiz çoğaltma, ticari kullanım, scraping ve veri madenciliği yasaktır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">14. Yasaklanan Kullanımlar</h2><p className="leading-7">Sahte bilgiyle sipariş oluşturma, yetkisiz erişim, bot/crawler kullanımı, kampanya suistimali, karalayıcı içerik üretimi ve mevzuata aykırı kullanım açıkça yasaktır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">15. Üçüncü Taraf Hizmetler ve Bağlantılar</h2><p className="leading-7">Ödeme, kargo, harita ve sosyal medya gibi üçüncü taraf servislerde ilgili sağlayıcının koşulları geçerli olur.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">16. Sorumluluğun Sınırlandırılması</h2><p className="leading-7">Site kesintisiz/hatasız çalışma taahhüdü vermez. Antika ürünlerin doğasından kaynaklanan özellikler her durumda ayıp sayılmaz. Ancak tüketici mevzuatından doğan emredici haklar saklıdır.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">17. Değişiklik Hakkı</h2><p className="leading-7">Kullanım Koşulları mevzuat, teknik gereklilik veya ticari süreç güncellemelerine göre revize edilebilir. Güncel metin yayımlandığı tarihte yürürlüğe girer.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">18. Delil Sözleşmesi ve Elektronik Kayıtlar</h2><p className="leading-7">Taraflar, mevzuatın izin verdiği ölçüde sistem kayıtları, loglar ve elektronik yazışmaların delil niteliğini kabul eder. Bu hüküm tüketicinin emredici haklarını ortadan kaldırmaz.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">19. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2><p className="leading-7">İşbu Kullanım Koşulları&apos;na Türkiye Cumhuriyeti hukuku uygulanır. Tüketici işlemlerinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.</p></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">20. İletişim</h2><ul className="list-disc space-y-1 pl-6 leading-7"><li>Mesut Can (Şahıs İşletmesi)</li><li>Hüseyinağa Mahallesi, Meşrutiyet Caddesi, Avrupa Pasajı No: 7, Beyoğlu / İstanbul</li><li>Telefon: +90 507 687 92 15</li><li>E-posta: destek@canantika.com</li></ul></section>

          <section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">21. İlgili Hukuki Metinler</h2><ul className="list-disc space-y-1 pl-6 leading-7"><li><Link href="/kvkk" className="underline-offset-4 hover:underline">KVKK Aydınlatma Metni</Link></li><li><Link href="/gizlilik" className="underline-offset-4 hover:underline">Gizlilik Politikası</Link></li><li><Link href="/cerezler" className="underline-offset-4 hover:underline">Çerez Politikası</Link></li><li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Mesafeli Satış Sözleşmesi</Link></li><li><Link href="/mesafeli-satis-sozlesmesi" className="underline-offset-4 hover:underline">Ön Bilgilendirme Formu</Link></li><li><Link href="/iade" className="underline-offset-4 hover:underline">İade / İptal / Cayma Politikası</Link></li><li><Link href="/teslimat" className="underline-offset-4 hover:underline">Teslimat / Kargo Politikası</Link></li></ul></section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
