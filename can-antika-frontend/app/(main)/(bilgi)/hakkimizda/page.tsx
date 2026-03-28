import type { Metadata } from "next"
import Image from "next/image"
import { PageHero } from "@/components/layout/page-hero"
import { Award, Clock, Heart, Quote, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda - 1990'dan Beri Antika Uzmanı",
  description:
    "1990'dan beri İstanbul Beyoğlu'nda antika tutkunlarına hizmet veriyorum. Osmanlı döneminden Art Deco'ya kadar geniş yelpazede eşsiz eserler sunuyorum.",
  keywords: ["can antika", "hakkımızda", "antikacı istanbul", "antika uzmanı", "çukurcuma antikacısı", "mesut can"],
  openGraph: {
    title: "Hakkımızda | Can Antika",
    description: "1990'dan beri İstanbul'da antika tutkunlarına hizmet veriyorum.",
    type: "website",
    locale: "tr_TR",
  },
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      <main>
        <PageHero
          imageSrc="/vintage-sepia-antique-collection-old-photographs-o.jpg"
          imageAlt="Hakkımızda"
          eyebrow="Est. 1990"
          title="Hakkımızda"
          description="Geçmişin zarafetini geleceğe taşıyan bir tutku hikayesi"
          priority
        />

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-lg border-2 border-accent/20" />
                <div className="absolute -inset-3 rounded-lg border border-accent/10" />

                <div className="relative">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-2xl">
                    <Image
                      src="/distinguished-turkish-gentleman-antique-dealer-60s.jpg"
                      alt="Mehmet Can - Can Antika kurucusu"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="absolute -bottom-6 -right-6 rounded-xl bg-primary p-6 shadow-xl">
                    <p className="font-serif text-4xl font-bold text-primary-foreground">35+</p>
                    <p className="text-sm text-primary-foreground/80">Yıllık Deneyim</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-8 rounded-lg border border-border/50 bg-card px-6 py-3 shadow-lg">
                  <p className="font-serif text-xl italic text-primary">Mehmet Can</p>
                </div>
              </div>

              <div className="lg:pl-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Kurucu
                </span>

                <h2 className="mt-6 font-serif text-4xl font-semibold leading-tight text-foreground">Mehmet Can</h2>

                <p className="mt-2 text-lg font-medium text-accent">Antika Uzmanı & Koleksiyoner</p>

                <div className="mt-8 space-y-6 leading-relaxed text-muted-foreground">
                  <p>
                    1990 yılında, babamın bana aktardığı antika sevgisiyle bu yolculuğa başladım. İstanbul&apos;un tarihi
                    Beyoğlu semtinde açtığım küçük dükkan, bugün Türkiye&apos;nin en saygın antika galerilerinden biri
                    haline geldi.
                  </p>

                  <p>
                    35 yılı aşkın deneyimimle, Osmanlı döneminden Art Deco&apos;ya, Viktoryen&apos;den 19. yüzyıl klasiklerine
                    kadar geniş bir yelpazede eşsiz antika eserler sunuyorum. Her parça, titizlikle incelenir ve
                    orijinalliği kişisel garantim altındadır.
                  </p>

                  <p>
                    Antikacılık benim için sadece bir meslek değil, bir yaşam biçimi. Her eserin arkasındaki hikayeyi
                    keşfetmek, o hikayeyi yeni sahiplerine aktarmak bana tarif edilemez bir mutluluk veriyor.
                  </p>
                </div>

                <div className="mt-10 relative border-l-2 border-accent/30 pl-6">
                  <Quote className="absolute -left-3 -top-1 h-6 w-6 bg-background text-accent/50" />
                  <p className="font-serif text-xl italic text-foreground">
                    &ldquo;Her antika parça, geçmişten gelen bir mektuptur. Ben sadece postacıyım.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-muted/30 py-24">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mb-4 inline-block font-serif text-sm uppercase tracking-widest text-accent">
                Değerlerim
              </span>
              <h2 className="font-serif text-4xl font-semibold text-foreground">Beni Farklı Kılan Değerler</h2>
              <p className="mt-4 text-lg text-muted-foreground">35 yıldır aynı prensiplerle çalışıyorum</p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Shield,
                  title: "Güvenilirlik",
                  desc: "Her eser, kişisel garantim ve sertifikam ile sunulur",
                },
                {
                  icon: Award,
                  title: "Uzmanlık",
                  desc: "35 yılı aşkın deneyim ve derin bilgi birikimi",
                },
                {
                  icon: Heart,
                  title: "Tutku",
                  desc: "Her parçaya aynı özen ve sevgiyle yaklaşırım",
                },
                {
                  icon: Clock,
                  title: "Sabır",
                  desc: "Doğru parçayı bulmak için acele etmem",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group relative rounded-xl border border-border/50 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <span className="mb-4 inline-block font-serif text-sm uppercase tracking-widest text-accent">
                Yolculuğum
              </span>
              <h2 className="font-serif text-4xl font-semibold text-foreground">35 Yıllık Bir Hikaye</h2>
            </div>

            <div className="relative">
              <div className="absolute bottom-0 left-8 top-0 w-px bg-border lg:left-1/2 lg:-translate-x-px" />

              {[
                { year: "1990", title: "Başlangıç", desc: "Beyoğlu'nda küçük bir dükkan ile yolculuğum başladı" },
                { year: "2000", title: "Büyüme", desc: "Koleksiyonumu genişleterek Osmanlı eserlerine odaklandım" },
                { year: "2010", title: "Tanınma", desc: "Türkiye'nin önde gelen antika galerilerinden biri haline geldim" },
                { year: "2020", title: "Dijitalleşme", desc: "Online platformlarla daha geniş kitlelere ulaşmaya başladım" },
              ].map((item, index) => (
                <div
                  key={item.year}
                  className={`relative flex items-center gap-8 pb-12 last:pb-0 ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                >
                  <div className="absolute left-8 h-4 w-4 rounded-full border-4 border-background bg-primary shadow lg:left-1/2 lg:-translate-x-1/2" />
                  <div className={`ml-20 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:pl-16"}`}>
                    <span className="inline-block font-serif text-3xl font-bold text-accent">{item.year}</span>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="hidden lg:block lg:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary py-24">
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-serif text-4xl font-semibold text-primary-foreground">Koleksiyonumu Keşfedin</h2>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-primary-foreground/80">
              Her biri özenle seçilmiş, eşsiz antika parçalarımı incelemek için mağazamızı ziyaret edin
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/urunler"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-4 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Ürünleri İncele
              </a>
              <a
                href="/iletisim"
                className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20"
              >
                İletişime Geç
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}