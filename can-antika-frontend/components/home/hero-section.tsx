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
      <div className="absolute inset-0 -z-20">
        <Image
          src="/dükkan.webp"
          alt="Can Antika mağaza içi"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1510]/95 via-[#1a1510]/80 to-[#1a1510]/50" />
      </div>

      <div className="pointer-events-none absolute left-8 top-8 h-32 w-32 opacity-30">
        <svg viewBox="0 0 100 100" className="h-full w-full text-[#d1a46e]/70">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
          <path d="M0,30 L15,30 M30,0 L30,15" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute right-8 top-8 -z-10 h-32 w-32 rotate-90 opacity-30">
        <svg viewBox="0 0 100 100" className="h-full w-full text-[#d1a46e]/70">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-8 left-8 -z-10 h-32 w-32 -rotate-90 opacity-30">
        <svg viewBox="0 0 100 100" className="h-full w-full text-[#d1a46e]/70">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-8 right-8 -z-10 h-32 w-32 rotate-180 opacity-30">
        <svg viewBox="0 0 100 100" className="h-full w-full text-[#d1a46e]/70">
          <path d="M0,50 Q0,0 50,0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10,50 Q10,10 50,10" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="0" r="3" fill="currentColor" />
          <circle cx="0" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col items-start justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d1a46e]/70" />
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full border border-[#d1a46e]/35" />
              <p className="rounded-full border border-[#d1a46e]/55 bg-[#7b4019]/35 px-4 py-1.5 font-serif text-xs uppercase tracking-[0.3em] text-[#f1d3ab]">
                1990&apos;dan Beri
              </p>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d1a46e]/70" />
          </div>

          <div className="relative">
            <h1 className="text-balance font-serif text-5xl font-semibold leading-tight tracking-tight text-[#f8eddc] sm:text-6xl lg:text-7xl">
              Geçmişin
              <span className="block text-[#d1a46e]">Zarafeti</span>
              <span className="text-4xl sm:text-5xl lg:text-6xl">Evinizde</span>
            </h1>
            <svg className="mt-4 h-6 w-48 text-[#d1a46e]/70" viewBox="0 0 200 24">
              <path d="M0,12 Q50,0 100,12 T200,12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="12" r="4" fill="currentColor" />
              <circle cx="0" cy="12" r="2" fill="currentColor" />
              <circle cx="200" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#ead9c2]/85 text-pretty">
            Her biri eşsiz hikayeler barındıran, uzman değerlendirmesinden geçmiş nadide antika eserler.
            <span className="italic text-[#e8c59a]"> Zamansız güzelliği keşfedin.</span>
          </p>

          <div className="mt-10 flex max-w-md gap-2">
            <div className="relative flex-1">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#d1a46e]/25 to-[#7b4019]/20 blur" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-[#c59a6f]/85" />
                <Input
                  type="search"
                  placeholder="Antika ara..."
                  className="h-14 rounded-lg border-[#b88b61]/35 bg-[#2f1d14]/60 pl-12 text-[#f4e6d3] placeholder:text-[#cfb08b]/65 focus:border-[#d1a46e]/60 focus:ring-[#d1a46e]/25"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                />
              </div>
            </div>
            <Button
              onClick={doSearch}
              className="h-14 rounded-lg border border-[#b98b5c]/45 bg-gradient-to-b from-[#8a5429] to-[#6f421f] px-8 font-serif text-amber-50 shadow-lg shadow-[#4a2b14]/35 hover:from-[#9a6031] hover:to-[#7c4923]"
            >
              Ara
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
