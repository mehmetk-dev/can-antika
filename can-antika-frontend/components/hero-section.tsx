"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const [heroSearch, setHeroSearch] = useState("")
  const router = useRouter()

  const doSearch = () => {
    if (heroSearch.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(heroSearch.trim())}`)
    }
  }

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/elegant-antique-room-with-vintage-furniture-chande.jpg"
          alt="Antika oda"
          fill
          priority
          unoptimized={true}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1510]/95 via-[#1a1510]/80 to-[#1a1510]/50" />
      </div>

      <div className="absolute left-8 top-8 h-32 w-32 opacity-30 pointer-events-none">
        <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-400/60">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
          <path d="M0,30 L15,30 M30,0 L30,15" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute right-8 top-8 h-32 w-32 opacity-30 rotate-90 -z-10">
        <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-400/60">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute left-8 bottom-8 h-32 w-32 opacity-30 -rotate-90 -z-10">
        <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-400/60">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute right-8 bottom-8 h-32 w-32 opacity-30 rotate-180 -z-10">
        <svg viewBox="0 0 100 100" className="h-full w-full text-emerald-400/60">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col items-start justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-400/60" />
            <div className="relative">
              <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-pulse" />
              <p className="rounded-full border border-emerald-400/50 bg-emerald-900/30 px-4 py-1.5 font-serif text-xs uppercase tracking-[0.3em] text-emerald-300">
                1990’dan Beri
              </p>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-400/60" />
          </div>

          <div className="relative">
            <h1 className="font-serif text-5xl font-semibold leading-tight tracking-tight text-emerald-50 sm:text-6xl lg:text-7xl text-balance">
              Geçmişin
              <span className="block text-emerald-400">Zarafeti</span>
              <span className="text-4xl sm:text-5xl lg:text-6xl">Evinizde</span>
            </h1>
            {/* Dekoratif altı çizgi */}
            <svg className="mt-4 h-6 w-48 text-emerald-400/60" viewBox="0 0 200 24">
              <path d="M0,12 Q50,0 100,12 T200,12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="12" r="4" fill="currentColor" />
              <circle cx="0" cy="12" r="2" fill="currentColor" />
              <circle cx="200" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-emerald-100/70 text-pretty max-w-xl">
            Her biri eşsiz hikayeler barındıran, uzman değerlendirmesinden geçmiş nadide antika eserler.
            <span className="italic text-emerald-200/80"> Zamansız güzelliği keşfedin.</span>
          </p>

          <div className="mt-10 flex max-w-md gap-2">
            <div className="relative flex-1">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 blur" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-emerald-600/70" />
                <Input
                  type="search"
                  placeholder="Antika ara..."
                  className="h-14 rounded-lg border-emerald-800/30 bg-emerald-950/50 pl-12 text-emerald-100 placeholder:text-emerald-300/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                />
              </div>
            </div>
            <Button onClick={doSearch} className="h-14 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-8 font-serif text-emerald-50 shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500/20">
              Ara
            </Button>
          </div>

          <div className="mt-14 flex gap-6 sm:gap-10">
            {[
              { value: "2000+", label: "Eşsiz Parça" },
              { value: "34", label: "Yıllık Deneyim" },
              { value: "5000+", label: "Mutlu Koleksiyoner" },
            ].map((stat, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-2 rounded-lg border border-emerald-400/10 bg-emerald-900/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative text-center">
                  <p className="font-serif text-4xl font-bold text-emerald-400">{stat.value}</p>
                  <div className="mt-1 h-px w-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                  <p className="mt-2 text-sm text-emerald-200/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </section>
  )
}
