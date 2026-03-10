import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FeaturedStory() {
  return (
    <section className="relative bg-gradient-to-b from-white to-amber-50 py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="story-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M25,0 L25,50 M0,25 L50,25" stroke="currentColor" strokeWidth="0.5" className="text-amber-900" />
            <circle cx="25" cy="25" r="2" fill="currentColor" className="text-amber-900" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#story-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative">
            {/* Dış çerçeve */}
            <div className="absolute -inset-4 border-2 border-amber-300/50 rounded-sm" />
            <div className="absolute -inset-2 border border-amber-200/30 rounded-sm" />

            {/* Köşe süsleri */}
            <div className="absolute -left-6 -top-6 z-10">
              <svg className="h-12 w-12 text-amber-600/70" viewBox="0 0 48 48">
                <path d="M0,24 Q0,0 24,0" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M6,24 Q6,6 24,6" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="24" cy="0" r="3" fill="currentColor" />
                <circle cx="0" cy="24" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -right-6 -top-6 z-10 rotate-90">
              <svg className="h-12 w-12 text-amber-600/70" viewBox="0 0 48 48">
                <path d="M0,24 Q0,0 24,0" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M6,24 Q6,6 24,6" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="24" cy="0" r="3" fill="currentColor" />
                <circle cx="0" cy="24" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-6 -left-6 z-10 -rotate-90">
              <svg className="h-12 w-12 text-amber-600/70" viewBox="0 0 48 48">
                <path d="M0,24 Q0,0 24,0" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M6,24 Q6,6 24,6" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="24" cy="0" r="3" fill="currentColor" />
                <circle cx="0" cy="24" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-6 -right-6 z-10 rotate-180">
              <svg className="h-12 w-12 text-amber-600/70" viewBox="0 0 48 48">
                <path d="M0,24 Q0,0 24,0" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M6,24 Q6,6 24,6" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="24" cy="0" r="3" fill="currentColor" />
                <circle cx="0" cy="24" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>

            <div className="aspect-[4/5] overflow-hidden rounded-sm">
              <Image
                src="/antique-dealer-examining-vintage-clock-with-magnif.jpg"
                alt="Antika değerlendirme"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Sepia efekti */}
              <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
            </div>

            {/* Vintage etiket */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 transform">
              <div className="rounded-sm border border-amber-400 bg-amber-50 px-6 py-2 shadow-lg">
                <p className="font-serif text-sm font-medium text-amber-800">Est. 1990</p>
              </div>
            </div>
          </div>

          <div className="lg:pl-8">
            {/* Dekoratif başlık */}
            <div className="flex items-center gap-4">
              <svg className="h-8 w-8 text-amber-600" viewBox="0 0 32 32">
                <path
                  d="M16,4 L20,12 L28,12 L22,18 L24,26 L16,22 L8,26 L10,18 L4,12 L12,12 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="16" cy="16" r="4" fill="currentColor" />
              </svg>
              <p className="font-serif text-sm uppercase tracking-[0.3em] text-amber-600">Hikayemiz</p>
            </div>

            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-amber-950 sm:text-5xl text-balance">
              Geçmişin Koruyucuları
            </h2>

            <svg className="mt-4 h-4 w-32 text-amber-400" viewBox="0 0 128 16">
              <path d="M0,8 L50,8 M78,8 L128,8" stroke="currentColor" strokeWidth="1" />
              <circle cx="64" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="64" cy="8" r="2" fill="currentColor" />
            </svg>

            <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-amber-800/80">
              <p>
                <span className="float-left mr-2 font-serif text-5xl font-bold leading-none text-amber-600">1</span>990
                yılında İstanbul’un tarihi Çukurcuma semtinde küçük bir dükkân olarak başlayan yolculuğumuz, bugün
                Türkiye’nin en saygın antika merkezlerinden biri haline geldi.
              </p>
              <p className="text-base">
                Her eser, ekibimizin titiz araştırması ve uzman değerlendirmesinden geçerek koleksiyonumuza dahil olur.
                <em className="text-amber-700"> Sadece antika satmıyoruz; tarihi koruyoruz ve geleceğe aktarıyoruz.</em>
              </p>
            </div>

            {/* Vintage butonlar */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/hakkimizda">
                <Button className="group gap-2 rounded-sm border-2 border-amber-700 bg-amber-800 px-8 py-6 font-serif text-base text-amber-50 shadow-lg transition-all hover:bg-amber-900 hover:shadow-xl">
                  Daha Fazla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/iletisim">
                <Button
                  variant="outline"
                  className="rounded-sm border-2 border-amber-600 bg-transparent px-8 py-6 font-serif text-base text-amber-800 transition-all hover:bg-amber-100"
                >
                  İletişime Geçin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
