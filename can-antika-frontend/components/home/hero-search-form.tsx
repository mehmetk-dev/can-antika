"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function HeroSearchForm() {
  const [heroSearch, setHeroSearch] = useState("")
  const router = useRouter()

  const doSearch = () => {
    if (heroSearch.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(heroSearch.trim())}`)
    }
  }

  return (
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
  )
}
