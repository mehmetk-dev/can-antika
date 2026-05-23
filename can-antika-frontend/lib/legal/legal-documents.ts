import { LEGAL_BUSINESS_INFO } from "./business-info"

export const LEGAL_DOCUMENTS_UPDATED_AT = "23 Mart 2026"

export type LegalDocumentSection = {
  heading: string
  body: string[]
}

export const PRE_INFORMATION_SECTIONS: LegalDocumentSection[] = [
  {
    heading: "1. Satıcı Bilgileri",
    body: [
      `Ticari ünvan: ${LEGAL_BUSINESS_INFO.companyName}`,
      `Marka: ${LEGAL_BUSINESS_INFO.brandName}`,
      `Faaliyet konusu: ${LEGAL_BUSINESS_INFO.businessType}`,
      `Faaliyet kodu: ${LEGAL_BUSINESS_INFO.activityCode}`,
      `Vergi türü: ${LEGAL_BUSINESS_INFO.taxType}`,
      `Vergi dairesi: ${LEGAL_BUSINESS_INFO.taxOffice}`,
      `Vergi kimlik no: ${LEGAL_BUSINESS_INFO.taxId}`,
      `İnternet sitesi: ${LEGAL_BUSINESS_INFO.website}`,
      `Adres: ${LEGAL_BUSINESS_INFO.address}`,
      `Telefon: ${LEGAL_BUSINESS_INFO.phone}`,
      `E-posta: ${LEGAL_BUSINESS_INFO.email}`,
    ],
  },
  {
    heading: "2. Ürün, Fiyat ve Teslimat Bilgileri",
    body: [
      "Siparişe konu ürünün temel nitelikleri, satış fiyatı, vergiler dahil toplam bedeli, kargo bedeli ve teslimat bilgileri ödeme adımından önce sepet ve sipariş özeti ekranlarında gösterilir.",
      "Antika ve koleksiyon ürünlerinde dönem, materyal, ölçü, kondisyon ve varsa özel açıklamalar ürün detay sayfasındaki bilgilere göre değerlendirilir.",
    ],
  },
  {
    heading: "3. Ödeme ve Sipariş Onayı",
    body: [
      "Alıcı, siparişi tamamlamadan önce ürün bedeli, kargo bedeli, teslimat adresi, ödeme yöntemi ve yasal metinleri kontrol eder.",
      "Siparişin oluşturulması için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onayı alınır.",
    ],
  },
  {
    heading: "4. Teslimat",
    body: [
      "Ürünler, ödeme ve sipariş onayından sonra alıcının belirttiği teslimat adresine gönderilir. Teslimat süresi ve kargo koşulları Teslimat / Kargo Politikası kapsamında uygulanır.",
    ],
  },
  {
    heading: "5. Cayma Hakkı ve İade",
    body: [
      "Tüketici, mevzuatta belirtilen istisnalar saklı kalmak üzere cayma hakkını kullanabilir. İade, iptal ve cayma süreçleri İade / İptal / Cayma Politikası kapsamında yürütülür.",
    ],
  },
  {
    heading: "6. Uyuşmazlık Çözümü",
    body: [
      "Tüketici şikayet ve itirazlarında, mevzuatta belirtilen parasal sınırlar dahilinde tüketici hakem heyetleri ve tüketici mahkemeleri yetkilidir.",
    ],
  },
]

export const DISTANCE_SALES_SECTIONS: LegalDocumentSection[] = [
  {
    heading: "Madde 1 - Taraflar",
    body: [
      `Satıcı: ${LEGAL_BUSINESS_INFO.companyName}`,
      `Adres: ${LEGAL_BUSINESS_INFO.address}`,
      `Telefon: ${LEGAL_BUSINESS_INFO.phone}`,
      `E-posta: ${LEGAL_BUSINESS_INFO.email}`,
      "Alıcıya ilişkin ad-soyad, teslimat adresi, fatura adresi, telefon ve e-posta bilgileri sipariş sırasında sisteme girilen bilgilerden oluşur.",
      "Alıcı, siparişi onaylayarak işbu sözleşmeyi kabul etmiş sayılır.",
    ],
  },
  {
    heading: "Madde 2 - Sözleşmenin Konusu",
    body: [
      "İşbu sözleşmenin konusu, alıcının satıcıya ait www.canantika.com internet sitesi üzerinden elektronik ortamda sipariş verdiği ürünün satışı ve teslimine ilişkin olarak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında tarafların hak ve yükümlülüklerinin belirlenmesidir.",
      "Satışa sunulan ürünler antika, koleksiyonluk veya dekoratif nitelikli tekil parçalar olabilir. Bu nedenle bazı ürünlerin birebir aynısının tekrar temin edilmesi mümkün olmayabilir.",
    ],
  },
  {
    heading: "Madde 3 - Ürün Bilgileri",
    body: [
      "Sözleşme konusu ürünün adı ve temel nitelikleri; türü, materyali, ölçüsü, dönemi ve kondisyon bilgileri; satış fiyatı ve vergiler dahil toplam bedeli; teslimat ve varsa ek masrafları ile ödeme yöntemi sipariş özeti ekranında ve sipariş onayında yer alır.",
      "Ürün sayfasındaki fotoğraflar esasen ürünün gerçek görsellerini göstermeyi amaçlar. Ekran, ışık ve cihaz farklılıkları nedeniyle ton farkları oluşabilir. Antika ürünlerde yaşa bağlı patina ve doğal kullanım belirtileri, açıklamada belirtildiği ölçüde tek başına ayıp sayılmaz.",
    ],
  },
  {
    heading: "Madde 4 - Fiyat, Ödeme ve Sipariş Onayı",
    body: [
      "Ürün fiyatları aksi belirtilmedikçe Türk Lirası cinsindendir. Ödeme, sitede fiilen sunulan yöntemlerle yapılır. Kart verileri ödeme kuruluşu veya banka altyapısı üzerinden işlenir; satıcı tarafından saklanmaz.",
      "Alıcı, siparişi onayladığında ödeme yükümlülüğü altına girdiğini kabul eder. Sözleşme bedeli dışında ilave ödeme doğuracak seçenekler yalnızca tüketicinin açık onayıyla tahsil edilebilir.",
    ],
  },
  {
    heading: "Madde 5 - Teslimat",
    body: [
      "Ürün, alıcının sipariş sırasında bildirdiği teslimat adresine gönderilir. Satıcı, özel bir süre taahhüdü yoksa ürünü en geç 30 gün içinde teslim etmekle yükümlüdür.",
      "Malın tüketiciye teslimine kadar oluşan kayıp ve hasardan kural olarak satıcı sorumludur. Tüketici satıcının belirlediği taşıyıcı dışında farklı taşıyıcı talep etmişse, ilgili aşamadaki sorumluluk mevzuat kapsamında ayrıca değerlendirilir.",
    ],
  },
  {
    heading: "Madde 6 - Cayma Hakkı",
    body: [
      "Alıcı, ürünün kendisine veya gösterdiği adresteki kişi ya da kuruluşa tesliminden itibaren 14 gün içinde, gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Malın teslimine kadar da cayma hakkı kullanılabilir.",
      `Cayma bildirimi için yazılı beyan veya kalıcı veri saklayıcısı yeterlidir. Bildirim adresi: ${LEGAL_BUSINESS_INFO.email}`,
    ],
  },
  {
    heading: "Madde 7 - İade Kargo Masrafı",
    body: [
      "Ön bilgilendirmede anlaşmalı iade taşıyıcısı belirtilmişse ve iade bu taşıyıcıyla yapılıyorsa tüketici iade kargo masrafından sorumlu tutulamaz.",
      "Ön bilgilendirmede taşıyıcı belirtilmemişse tüketiciden iade masrafı talep edilemez.",
    ],
  },
  {
    heading: "Madde 8 - Cayma Hakkının Kullanılamayacağı Haller",
    body: [
      "Mesafeli Sözleşmeler Yönetmeliği'nde düzenlenen istisnalar saklıdır. Tüketicinin özel isteklerine göre hazırlanan ürünler ve mevzuatta cayma dışında bırakılan diğer haller bu kapsamdadır.",
      "Antika ürünlerde yalnızca yaşa bağlı doğal izler veya önceden açıklanmış kondisyon unsurları tek başına cayma hakkını ortadan kaldırmaz.",
    ],
  },
  {
    heading: "Madde 9 - Ayıplı Ürün ve Tüketicinin Seçimlik Hakları",
    body: [
      "Ayıplı teslim halinde tüketicinin 6502 sayılı Kanun kapsamındaki seçimlik hakları saklıdır. Tekil ürün yapısı nedeniyle ayıpsız misliyle değişim her zaman mümkün olmayabilir; diğer yasal haklar saklıdır.",
    ],
  },
  {
    heading: "Madde 10 - Antika Ürünlere İlişkin Özel Not",
    body: [
      "Satışa sunulan ürünler antika ve koleksiyonluk niteliğinde tekil parçalar olabilir. Ürünle birlikte sunulan kondisyon açıklamaları ve görseller satış kapsamı bakımından esastır.",
    ],
  },
  {
    heading: "Madde 11 - İfanın İmkansızlaşması",
    body: [
      "Edimin ifasının imkansızlaştığı hallerde satıcı, durumu 3 gün içinde alıcıya bildirir ve tahsil edilen ödemeleri bildirim tarihinden itibaren en geç 14 gün içinde iade eder.",
    ],
  },
  {
    heading: "Madde 12 - Uyuşmazlık Çözümü",
    body: [
      "İşbu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Parasal sınırlara göre Tüketici Hakem Heyeti veya Tüketici Mahkemesi yetkilidir.",
    ],
  },
  {
    heading: "Madde 13 - Elektronik Kayıtlar ve Yürürlük",
    body: [
      "Taraflar, mevzuatın izin verdiği ölçüde sipariş kayıtları, sistem logları, elektronik onay kayıtları ve yazışmaların delil olarak dikkate alınabileceğini kabul eder.",
      "Sözleşme, alıcı tarafından elektronik ortamda onaylandığı tarihte yürürlüğe girer.",
    ],
  },
]

export const RETURN_POLICY_SECTIONS: LegalDocumentSection[] = [
  {
    heading: "1. Cayma Hakkı",
    body: [
      "Tüketici, satın aldığı ürünü teslim aldığı tarihten itibaren 14 gün içinde, herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin iade etme hakkına sahiptir.",
      "Ürün henüz teslim edilmemişse teslimata kadar olan sürede de cayma hakkı kullanılabilir.",
      "Cayma hakkının kullanılması için bu süre içinde tarafımıza açık bir bildirim yapılması yeterlidir.",
    ],
  },
  {
    heading: "2. Cayma Hakkının Kullanımı",
    body: [
      "Cayma hakkınızı kullanmak için, 14 günlük süre içinde telefon veya e-posta yoluyla bizimle iletişime geçerek iade talebinizi bildirmeniz gerekir.",
      "Cayma bildiriminizin ardından, ürünü bildirim tarihinden itibaren 10 gün içinde tarafımıza geri göndermeniz gerekmektedir.",
      "Satıcı olarak biz de cayma bildiriminin tarafımıza ulaştığı tarihten itibaren 14 gün içinde tahsil edilen ödemeleri iade etmekle yükümlüyüz. Ancak iade, ürünün tarafımıza ulaşması veya tüketici tarafından geri gönderildiğinin ispat edilmesi beklenerek yapılabilir.",
    ],
  },
  {
    heading: "3. İade Koşulları",
    body: [
      "İade edilecek ürünün mümkünse eksiksiz şekilde, varsa birlikte gönderilen fatura ve ek parçalarıyla birlikte gönderilmesi gerekir.",
      "Cayma hakkının kullanılması için ürünün mutlaka hiç açılmamış, hiç dokunulmamış veya hiç incelenmemiş olması şart değildir. Tüketici, ürünü niteliğine, özelliklerine ve işleyişine uygun şekilde makul ölçüde inceleyebilir.",
      "Ürünün tüketici tarafından olağan inceleme sınırını aşacak şekilde kullanılması, zarar görmesi, eksiltilmesi, değiştirilmesi, birlikte verilen belge veya ayırt edici unsurların kaybedilmesi ya da ürüne sonradan müdahale edilmesi ayrıca değerlendirilir.",
      "Antika ürünlerde yaş, dönem, patina, yüzey izleri ve ürün açıklamasında önceden belirtilmiş kondisyon unsurları ayrıca dikkate alınır.",
    ],
  },
  {
    heading: "4. İade Edilemeyecek Durumlar",
    body: [
      "Mesafeli satış mevzuatında yer alan cayma hakkı istisnaları saklıdır.",
      "Tüketicinin özel isteği doğrultusunda özel olarak restore edilen veya kişiselleştirilen ürünler, siparişe özel hazırlanan veya üzerinde özel işlem yapılan ürünler, ürünün niteliği gereği tekrar satışa uygun olmayacak şekilde değiştirilmiş olması ve mevzuat gereği cayma hakkı dışında kalan diğer haller ayrıca değerlendirilir.",
    ],
  },
  {
    heading: "5. İade Kargo Süreci",
    body: [
      "Cayma hakkı kapsamında yapılacak iadelerde kargo masrafı, ön bilgilendirme metninde belirtilen taşıyıcı ve şartlara göre belirlenir.",
      "Satıcı, ön bilgilendirmede cayma halinde kullanılacak anlaşmalı taşıyıcıyı belirtmişse ve ürün bu taşıyıcı ile gönderilmişse, tüketici iadeye ilişkin masraflardan sorumlu tutulamaz.",
      "Ön bilgilendirmede böyle bir taşıyıcı belirtilmemişse de tüketiciden iade masrafı talep edilemez. Belirtilen taşıyıcının tüketicinin bulunduğu yerde şubesi yoksa, satıcı ilave masraf talep etmeksizin ürünü tüketiciden almakla yükümlüdür.",
    ],
  },
  {
    heading: "6. Geri Ödeme",
    body: [
      "Cayma hakkının usulüne uygun kullanılması halinde, ürün bedeli ve tahsil edilmişse teslimat dahil ilgili ödemeler, cayma bildiriminin tarafımıza ulaştığı tarihten itibaren 14 gün içinde iade edilir.",
      "İade, tüketicinin satın alma sırasında kullandığı ödeme aracına uygun şekilde ve tüketiciye ek maliyet yüklenmeden yapılır.",
      "Bankaların iç işlem süreleri nedeniyle tutarın kartınıza veya hesabınıza yansıması ayrıca birkaç gün sürebilir.",
    ],
  },
  {
    heading: "7. Ayıplı veya Hasarlı Ürünler",
    body: [
      "Teslim edilen ürünün ayıplı, eksik, kırık veya açıklamada belirtilenden farklı olduğu düşünülüyorsa, durumun mümkün olan en kısa sürede tarafımıza bildirilmesi gerekir.",
      "Ayıplı mal halinde tüketicinin, 6502 sayılı Kanun kapsamındaki seçimlik hakları saklıdır. Bunlar somut olaya göre sözleşmeden dönme, bedelde indirim, ücretsiz onarım veya mümkünse ayıpsız misliyle değişim olabilir.",
      "Tekil antika ürünlerde birebir değişim her zaman mümkün olmayabileceğinden, diğer yasal haklar ayrıca değerlendirilir.",
      "Teslimat sırasında kargo paketinde açık hasar görülüyorsa, kargo görevlisi ile birlikte tutanak tutulması faydalıdır. Ancak tutanak tutulmamış olması tek başına tüm hakların kaybı anlamına gelmez.",
    ],
  },
  {
    heading: "8. Sipariş İptali",
    body: [
      "Sipariş, ürün henüz kargoya verilmeden önce iptal edilebilir. İptal talebi için bizimle telefon veya e-posta üzerinden iletişime geçebilirsiniz.",
      "Siparişin iptal edilmesi halinde, tahsil edilen tutar ödeme yöntemine göre uygun süre içinde iade edilir. Banka ve ödeme kuruluşlarının işlem süreleri ayrıca uygulanabilir.",
    ],
  },
  {
    heading: "9. Antika Ürünlere İlişkin Özel Not",
    body: [
      "Can Antika'da satışa sunulan ürünlerin önemli bir bölümü tekil, dönemsel ve yaşa bağlı izler taşıyan ürünlerden oluşabilir.",
      "Ürün açıklamalarında belirtilen kondisyon, patina, yüzey izleri, eski kullanım izleri, onarım veya restorasyon bilgileri iade değerlendirmesinde dikkate alınır.",
      "Ürün açıklamasında açıkça belirtilmiş doğal yaş izleri veya dönemsel özellikler, tek başına ayıp olarak değerlendirilmez; buna karşılık açıklamada yer almayan önemli kusurlar ayrıca incelenir.",
    ],
  },
  {
    heading: "10. İletişim",
    body: [
      `İade, iptal, cayma hakkı veya ayıplı ürün başvurularınız için ${LEGAL_BUSINESS_INFO.phone} veya ${LEGAL_BUSINESS_INFO.email} üzerinden Can Antika ile iletişime geçebilirsiniz.`,
    ],
  },
]
