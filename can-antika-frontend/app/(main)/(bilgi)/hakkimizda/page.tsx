import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { PageHero } from "@/components/layout/page-hero"
import { Award, Crown, Gem, GlassWater, History, Key, Landmark, Quote, Shield, Sparkles, Star, Utensils } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "1982'den gelen aile tecrübesiyle şekillenen bir antika tutkusu. Orhan Can'ın Kapalıçarşı'da attığı temellerden, Mesut Can'ın Beyoğlu'ndaki modern vizyonuna uzanan hikayemiz.",
  keywords: ["can antika", "hakkımızda", "mesut can", "orhan can", "antikacı istanbul", "beyoğlu antikacı", "koleksiyon uzmanı"],
  openGraph: {
    title: "Hakkımızda | Can Antika",
    description: "Geçmişin zarafetini geleceğe taşıyan bir aile geleneği.",
    type: "website",
    locale: "tr_TR",
  },
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M6 114V64C6 31 31 6 64 6h50" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 106V68C14 40 36 14 64 14h38" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      <path d="M22 98V72c0-22 18-40 40-40h26" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      <circle cx="64" cy="64" r="4" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      <main>
        <PageHero
          imageSrc="/vintage-sepia-antique-collection-old-photographs-o.jpg"
          imageAlt="Can Antika Koleksiyon"
          eyebrow="Bir Aile Geleneği"
          title="Hikâyemiz"
          description="1982'den gelen aile tecrübesiyle, kuşaktan kuşağa aktarılan bir tutku"
          priority
        />

        {/* Kurucu Bölümü */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="relative">
                <div className="absolute -inset-10 opacity-10">
                  <CornerOrnament className="h-full w-full text-accent" />
                </div>
                
                <div className="relative">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/50">
                    <Image
                      src="/mesutcan.jpeg"
                      alt="Mesut Can - Can Antika Kurucusu"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>

                  <div className="absolute -bottom-8 -right-8 hidden rounded-2xl bg-primary p-8 shadow-2xl lg:block">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                        <Award className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-serif text-2xl font-bold text-primary-foreground">1982 Aile Tecrübesi</p>
                        <p className="text-xs uppercase tracking-widest text-primary-foreground/60">Sektörel Birikim</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative lg:pl-12">
                <div className="mb-8 flex items-center gap-3">
                  <span className="h-px w-8 bg-accent" />
                  <span className="font-serif text-sm uppercase tracking-[0.3em] text-accent">Kurucu</span>
                </div>

                <h2 className="font-cinzel text-5xl font-bold leading-tight text-foreground tracking-tight">
                  Mesut Can
                </h2>
                <p className="mt-2 text-xl font-medium text-accent/80 italic">Can Antika</p>

                <div className="mt-10 space-y-8 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    Antika ile tanışmam ailemden miras kalan bir tutkunun doğal bir devamı oldu. Babam Orhan Can, 1982 yılında Kapalıçarşı’da Rus, Avrupa ve Osmanlı dönemlerine ait seçkin antika eserlerin alım satımına başlayarak bu yolculuğun temelini attı.
                  </p>
                  
                  <p>
                    Gümüş objelerden madalya ve nişanlara, kağıt ve madeni paralardan enfiye kutularına kadar uzanan geniş bir koleksiyon anlayışıyla yıllar içinde güçlü bir birikim oluşturdu.
                  </p>

                  <div className="relative border-l-4 border-accent/20 bg-muted/30 p-8 py-6 italic shadow-inner">
                    <Quote className="absolute -left-3 -top-3 h-8 w-8 text-accent/40" />
                    &ldquo;Bizim için antikacılık sadece bir ticaret değil; geçmişle bugün arasında kurulan bir bağdır. Her eser, kendi döneminin izlerini taşıyan özel bir hikâyeye sahiptir.&rdquo;
                  </div>

                  <p>
                    Ben ise bu dünyaya 14 yaşımda adım attım. 2008 yılından itibaren antikaya olan ilgim, zamanla mesleğime dönüştü. Ailemizin 1997 yılında Beyoğlu’nda açtığı dükkanımızda, bugün Can Antika çatısı altında bu geleneği sürdürmekteyim.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Markalar Bölümü */}
        <section className="relative overflow-hidden bg-primary py-24 lg:py-32">
          {/* Arka plan dekorasyonu */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l30 30-30 30L0 30z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-20 text-center">
              <span className="font-cinzel text-sm uppercase tracking-[0.5em] text-accent/70">Küratör Seçkisi</span>
              <h2 className="mt-4 font-cinzel text-4xl font-bold text-primary-foreground md:text-5xl">Dünya Markaları & Nadide Parçalar</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/60">
                Koleksiyonumuzda yer alan, her biri kendi alanında ekol olmuş efsanevi markalar.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {[
                { 
                  name: "Christofle", 
                  sub: "Paris 1830", 
                  desc: "Gümüş işçiliğinde Fransız zarafeti.",
                  icon: Utensils
                },
                { 
                  name: "Lalique", 
                  sub: "Alsace 1888", 
                  desc: "Kristal ve cam sanatının zirvesi.",
                  icon: GlassWater
                },
                { 
                  name: "Tiffany & Co.", 
                  sub: "New York 1837", 
                  desc: "İkonik mücevher ve lüks tasarımı.",
                  icon: Gem
                },
                { 
                  name: "Fabergé", 
                  sub: "St. Petersburg 1842", 
                  desc: "Çarlık Rusyası'nın eşsiz mirası.",
                  icon: Crown
                },
                { 
                  name: "Sheffield", 
                  sub: "England 1743", 
                  desc: "İngiliz çeliği ve gümüş ustalığı.",
                  icon: Shield
                }
              ].map((brand) => (
                <div key={brand.name} className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-accent/30 bg-black/20 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-accent/60 hover:bg-black/40 hover:shadow-2xl hover:shadow-accent/10">
                  {/* Hallmark Style Ornament */}
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 transition-colors group-hover:border-accent">
                    <brand.icon className="h-6 w-6 text-accent transition-transform duration-500 group-hover:scale-110" strokeWidth={1} />
                  </div>

                  <h3 className="font-cinzel text-lg font-bold text-primary-foreground tracking-widest">{brand.name}</h3>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-accent/60 font-semibold">{brand.sub}</p>
                  
                  <div className="my-4 h-px w-8 bg-accent/20 transition-all group-hover:w-16 group-hover:bg-accent/40" />
                  
                  <p className="text-xs leading-relaxed text-primary-foreground/40 font-medium">
                    {brand.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Zaman Çizelgesi */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 translate-x-[-50%] rounded-full bg-accent/5 blur-[100px]" />
          
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-20 text-center">
              <Landmark className="mx-auto h-12 w-12 text-accent/40" />
              <h2 className="mt-6 font-cinzel text-4xl font-bold text-foreground">Yılların Birikimi</h2>
              <p className="mt-4 text-muted-foreground">Kuşaktan kuşağa aktarılan deneyim durakları</p>
            </div>

            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-accent/40 before:to-transparent lg:before:mx-auto">
              {[
                { 
                  year: "1982", 
                  title: "Kapalıçarşı Başlangıcı", 
                  desc: "Babam Orhan Can'ın, seçkin antika eserlerin alım satımıyla bu yolculuğun temellerini attığı yıl.",
                  icon: Landmark
                },
                { 
                  year: "1997", 
                  title: "Beyoğlu Dönemi", 
                  desc: "Bugün de geleneği sürdürdüğümüz, Beyoğlu'ndaki tarihi mağazamızın kapılarını açtığı dönem.",
                  icon: History
                },
                { 
                  year: "2008", 
                  title: "Mesleğe İlk Adım", 
                  desc: "14 yaşımda çıraklıkla başlayan yolculuğum ve antikaya olan ilgimin profesyonel mesleğime dönüşmesi.",
                  icon: Sparkles
                },
                { 
                  year: "Bugün", 
                  title: "Dijital Dönüşüm", 
                  desc: "Can Antika markasıyla, aileden miras kalan bu geleneksel değerleri modern platformlara taşıyoruz.",
                  icon: Star
                }
              ].map((item, idx) => (
                <div key={item.year} className="group relative flex items-center lg:justify-between py-2">
                  {/* Filigran Yıl (Arka Plan) */}
                  <div className={`hidden lg:flex lg:w-[45%] items-center ${idx % 2 === 0 ? "justify-end pr-16" : "order-last justify-start pl-16"}`}>
                    <span className="font-cinzel text-[5rem] font-black leading-none text-accent/[0.04] select-none transition-colors duration-500 group-hover:text-accent/10">{item.year}</span>
                  </div>
                  
                  {/* Merkez Düğüm (Elmas Şekli) */}
                  <div className="absolute left-0 flex h-10 w-10 rotate-45 items-center justify-center rounded-sm border border-accent/40 bg-background/90 shadow-[0_0_15px_rgba(var(--accent),0.1)] backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-accent/10 lg:left-1/2 lg:-ml-5 z-10">
                    <div className="-rotate-45">
                      <item.icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* İçerik Kartı */}
                  <div className={`ml-14 sm:ml-16 relative overflow-hidden rounded-xl border border-accent/20 bg-card/60 p-5 shadow-lg backdrop-blur-md transition-all duration-500 hover:border-accent/50 hover:bg-card/90 hover:shadow-xl lg:ml-0 lg:w-[45%] ${idx % 2 === 0 ? "lg:text-left" : "lg:text-right"}`}>
                    {/* Mobil Filigran (Sadece küçük ekranlarda görünür) */}
                    <div className="absolute -bottom-4 -right-2 pointer-events-none lg:hidden">
                      <span className="font-cinzel text-7xl font-black text-accent/[0.05]">{item.year}</span>
                    </div>

                    {/* Dekoratif Çizgiler */}
                    <div className={`absolute top-0 h-px w-24 bg-gradient-to-r from-transparent via-accent/50 to-transparent ${idx % 2 === 0 ? "left-8" : "right-8"}`} />
                    <div className={`absolute bottom-0 h-px w-24 bg-gradient-to-r from-transparent via-accent/50 to-transparent ${idx % 2 === 0 ? "left-8" : "right-8"}`} />

                    <span className="relative z-10 font-cinzel text-lg font-bold text-accent lg:hidden">{item.year}</span>
                    <h3 className="relative z-10 mt-1 font-cinzel text-xl font-bold text-foreground tracking-tight">{item.title}</h3>
                    
                    <div className={`relative z-10 my-3 h-px w-10 bg-accent/30 ${idx % 2 === 0 ? "" : "ml-auto"}`} />
                    
                    <p className="relative z-10 text-sm leading-relaxed text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vizyon ve CTA Bölümü (Antique Banner) */}
        <div className="px-4 sm:px-6 lg:px-8 mb-24 lg:mb-32">
          <section className="relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-2xl shadow-2xl">
            {/* Antika Görseli ve Kaplama */}
            <div className="absolute inset-0 bg-primary">
              <Image 
                src="/elegant-antique-shop-interior-with-chandeliers-and.jpg" 
                alt="Antika Dükkanı İçi" 
                fill 
                className="object-cover object-center opacity-30 mix-blend-luminosity"
              />
              {/* Lüks Kahverengi/Altın Degradesi */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/95 md:bg-gradient-to-r md:from-primary/95 md:via-primary/80 md:to-primary/90" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E')]" />
            </div>

            <div className="relative m-5 flex flex-col items-center justify-between gap-10 rounded-xl border border-accent/30 p-8 md:m-6 md:flex-row md:p-12 lg:p-16">
              {/* Sol Taraf: Metin */}
              <div className="max-w-2xl text-center md:text-left">
                <h2 className="font-cinzel text-3xl font-bold tracking-wide text-primary-foreground sm:text-4xl md:text-5xl">
                  Geleceğe <span className="text-accent italic">Miras</span>
                </h2>
                
                <div className="mt-5 mb-6 flex items-center justify-center gap-3 md:justify-start">
                  <div className="h-[2px] w-12 bg-accent/60" />
                  <div className="h-2 w-2 rotate-45 border border-accent/80" />
                  <div className="h-[2px] w-12 bg-accent/60" />
                </div>
                
                <p className="text-sm font-medium leading-relaxed text-primary-foreground/90 sm:text-base md:text-lg">
                  Her biri birer sanat eseri olan bu nadide hikâyeleri koruyarak doğru koleksiyonerlere ulaştırmak ve gelecek nesillere aktarmak en büyük gayemizdir. Sizi de bu tarihi yolculuğa davet ediyoruz.
                </p>
              </div>
              
              {/* Sağ Taraf: Buton */}
              <div className="w-full shrink-0 md:w-auto">
                <Link href="/urunler" className="group relative flex w-full items-center justify-center overflow-hidden rounded-sm border border-accent bg-accent px-6 py-5 transition-all duration-500 hover:bg-accent/90 hover:shadow-[0_0_25px_rgba(var(--accent),0.4)] md:inline-flex md:w-auto md:px-10">
                  {/* İç Çerçeve Animasyonu */}
                  <div className="absolute inset-1 border border-[#3d2b1f]/20 transition-all duration-500 group-hover:inset-2 group-hover:border-[#3d2b1f]/40" />
                  <span className="relative z-10 font-cinzel text-sm font-bold uppercase tracking-[0.2em] text-[#3d2b1f] transition-colors">
                    Koleksiyonu İncele
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
