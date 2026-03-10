import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Award, Heart, Clock, Quote } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda | Can Antika - 1990'dan Beri Antika Uzmanı",
  description:
    "1990'dan beri İstanbul Beyoğlu'nda antika tutkunlarına hizmet veriyorum. Osmanlı döneminden Art Deco'ya kadar geniş yelpazede eşsiz eserler sunuyorum.",
  keywords: ["can antika", "hakkımızda", "antikacı istanbul", "antika uzmanı", "çukurcuma antikacı", "mehmet can"],
  openGraph: {
    title: "Hakkımızda | Can Antika",
    description: "1990'dan beri İstanbul'da antika tutkunlarına hizmet veriyorum.",
    type: "website",
    locale: "tr_TR",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero - Vintage Style */}
        <section className="relative py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img src="/vintage-sepia-antique-collection-old-photographs-o.jpg" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/90 to-primary/95" />
          </div>

          {/* Decorative Frame */}
          <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 pointer-events-none" />
          <div className="absolute top-12 left-12 right-12 bottom-12 border border-accent/10 pointer-events-none" />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Decorative Element */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-accent/50" />
              <div className="w-2 h-2 rotate-45 border border-accent/50" />
              <div className="w-16 h-px bg-accent/50" />
            </div>

            <span className="inline-block font-serif text-accent text-lg tracking-widest uppercase mb-4">
              Est. 1990
            </span>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight">
              Hakkımda
            </h1>

            <p className="mt-6 text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Geçmişin zarafetini geleceğe taşıyan bir tutku hikayesi
            </p>

            {/* Decorative Element */}
            <div className="flex items-center justify-center gap-4 mt-10">
              <div className="w-24 h-px bg-accent/50" />
              <div className="w-3 h-3 rotate-45 bg-accent/30" />
              <div className="w-24 h-px bg-accent/50" />
            </div>
          </div>
        </section>

        {/* Owner Section */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              {/* Image */}
              <div className="relative">
                {/* Decorative Frame */}
                <div className="absolute -inset-6 border-2 border-accent/20 rounded-lg" />
                <div className="absolute -inset-3 border border-accent/10 rounded-lg" />

                <div className="relative">
                  <div className="aspect-[4/5] overflow-hidden rounded-lg shadow-2xl">
                    <img
                      src="/distinguished-turkish-gentleman-antique-dealer-60s.jpg"
                      alt="Mehmet Can - Can Antika kurucusu"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Badge */}
                  <div className="absolute -bottom-6 -right-6 bg-primary rounded-xl p-6 shadow-xl">
                    <p className="font-serif text-4xl font-bold text-primary-foreground">35+</p>
                    <p className="text-sm text-primary-foreground/80">Yıllık Deneyim</p>
                  </div>
                </div>

                {/* Signature */}
                <div className="absolute -bottom-4 left-8 bg-card px-6 py-3 rounded-lg shadow-lg border border-border/50">
                  <p className="font-serif text-xl italic text-primary">Mehmet Can</p>
                </div>
              </div>

              {/* Content */}
              <div className="lg:pl-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Kurucu
                </span>

                <h2 className="mt-6 font-serif text-4xl font-semibold text-foreground leading-tight">Mehmet Can</h2>

                <p className="mt-2 text-lg text-accent font-medium">Antika Uzmanı & Koleksiyoner</p>

                <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    1990 yılında, babamın bana aktardığı antika sevgisiyle bu yolculuğa başladım. İstanbul’un tarihi
                    Beyoğlu semtinde açtığım küçük dükkân, bugün Türkiye’nin en saygın antika galerilerinden biri
                    haline geldi.
                  </p>

                  <p>
                    35 yılı aşkın deneyimimle, Osmanlı döneminden Art Deco’ya, Viktoryen’den 19. yüzyıl klasiklerine
                    kadar geniş bir yelpazede eşsiz antika eserler sunuyorum. Her parça, titizlikle incelenir ve
                    orijinalliği kişisel garantim altındadır.
                  </p>

                  <p>
                    Antikacılık benim için sadece bir meslek değil, bir yaşam biçimi. Her eserin arkasındaki hikayeyi
                    keşfetmek, o hikayeyi yeni sahiplerine aktarmak bana tarif edilemez bir mutluluk veriyor.
                  </p>
                </div>

                {/* Quote */}
                <div className="mt-10 relative pl-6 border-l-2 border-accent/30">
                  <Quote className="absolute -left-3 -top-1 w-6 h-6 text-accent/50 bg-background" />
                  <p className="font-serif text-xl italic text-foreground">
                    “Her antika parça, geçmişten gelen bir mektuptur. Ben sadece postacıyım.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 bg-muted/30 relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block font-serif text-accent text-sm tracking-widest uppercase mb-4">
                Değerlerim
              </span>
              <h2 className="font-serif text-4xl font-semibold text-foreground">Beni Farklı Kılan Değerler</h2>
              <p className="mt-4 text-muted-foreground text-lg">35 yıldır aynı prensiplerle çalışıyorum</p>
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
                  className="group relative bg-card rounded-xl p-8 shadow-sm border border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  {/* Corner Decorations */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Journey Timeline */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block font-serif text-accent text-sm tracking-widest uppercase mb-4">
                Yolculuğum
              </span>
              <h2 className="font-serif text-4xl font-semibold text-foreground">35 Yıllık Bir Hikaye</h2>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border lg:left-1/2 lg:-translate-x-px" />

              {[
                { year: "1990", title: "Başlangıç", desc: "Beyoğlu'nda küçük bir dükkân ile yolculuğum başladı" },
                { year: "2000", title: "Büyüme", desc: "Koleksiyonumu genişleterek Osmanlı eserlerine odaklandım" },
                {
                  year: "2010",
                  title: "Tanınma",
                  desc: "Türkiye'nin önde gelen antika galerilerinden biri haline geldim",
                },
                {
                  year: "2020",
                  title: "Dijitalleşme",
                  desc: "Online platformlarla daha geniş kitlelere ulaşmaya başladım",
                },
              ].map((item, index) => (
                <div
                  key={item.year}
                  className={`relative flex items-center gap-8 pb-12 last:pb-0 ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                >
                  {/* Dot */}
                  <div className="absolute left-8 w-4 h-4 rounded-full bg-primary border-4 border-background shadow lg:left-1/2 lg:-translate-x-1/2" />

                  {/* Content */}
                  <div className={`ml-20 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:pl-16"}`}>
                    <span className="inline-block font-serif text-3xl font-bold text-accent">{item.year}</span>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.desc}</p>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden lg:block lg:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 border border-accent rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] border border-accent rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-4xl font-semibold text-primary-foreground">Koleksiyonumu Keşfedin</h2>
            <p className="mt-4 text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Her biri özenle seçilmiş, eşsiz antika parçalarımı incelemek için mağazamı ziyaret edin
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/urunler"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors"
              >
                Ürünleri İncele
              </a>
              <a
                href="/iletisim"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-foreground/10 text-primary-foreground font-medium rounded-lg hover:bg-primary-foreground/20 transition-colors border border-primary-foreground/20"
              >
                İletişime Geç
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
