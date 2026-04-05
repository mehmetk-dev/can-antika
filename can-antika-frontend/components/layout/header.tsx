import Link from "next/link"
import { Suspense } from "react"
import { HeaderClientIsland } from "@/components/header/header-client-island"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Ürünler", href: "/urunler", description: "Koleksiyonumuzu keşfedin" },
  { name: "Blog", href: "/blog", description: "Antika dünyasından yazılar" },
  { name: "Hakkımızda", href: "/hakkimizda", description: "35 yıllık tecrübe" },
  { name: "İletişim", href: "/iletisim", description: "Bize ulaşın" },
  { name: "SSS", href: "/sss", description: "Sık sorulan sorular" },
]

interface HeaderProps {
  sticky?: boolean
  className?: string
}

export function Header({ sticky = true, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "z-40 w-full border-b border-border/50 bg-background",
        sticky ? "sticky top-0" : "relative",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Mobile menu placeholder — client island renders here */}
          <div className="lg:hidden w-10" id="mobile-menu-slot" />

          {/* Logo — server rendered */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-primary lg:text-3xl">
              Can Antika
            </span>
          </Link>

          {/* Desktop Navigation — server rendered */}
          <nav className="hidden lg:flex lg:items-center lg:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Client island: search, auth, cart, mobile menu */}
          <Suspense fallback={<HeaderActionsSkeleton />}>
            <HeaderClientIsland navigation={navigation} />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

function HeaderActionsSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 animate-pulse rounded-md bg-muted/40" />
      <div className="h-9 w-9 animate-pulse rounded-md bg-muted/40" />
    </div>
  )
}
