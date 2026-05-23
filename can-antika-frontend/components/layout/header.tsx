import Link from "next/link"
import { Suspense, Fragment } from "react"
import { HeaderClientIsland } from "@/components/header/header-client-island"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Ürünler", href: "/urunler", description: "Koleksiyonumuzu keşfedin", prefetch: false },
  { name: "Blog", href: "/blog", description: "Antika dünyasından yazılar" },
  { name: "Hakkımızda", href: "/hakkimizda", description: "40 yılı aşkın tecrübe" },
  { name: "İletişim", href: "/iletisim", description: "Bize ulaşın" },
  { name: "Sıkça Sorulanlar", href: "/sss", description: "Sık sorulan sorular" },
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
          <Link href="/" className="flex items-center gap-2 group py-1">
            <span className="font-pinyon text-5xl font-normal tracking-wide text-primary lg:text-6.5xl transition-colors duration-300 group-hover:text-accent select-none leading-none pt-1">
              Can Antika
            </span>
          </Link>

          {/* Desktop Navigation — server rendered */}
          <nav className="hidden lg:flex lg:items-center lg:gap-4">
            {navigation.map((item, index) => (
              <Fragment key={item.name}>
                {index > 0 && (
                  <span className="text-primary/30 text-[9px] select-none font-light mx-2">
                    ◆
                  </span>
                )}
                <Link
                  href={item.href}
                  prefetch={item.prefetch}
                  className="relative font-italiana text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground/80 hover:text-primary transition-all duration-300 py-2 px-1 group"
                >
                  {item.name}
                  <span className="absolute bottom-1 left-1/2 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full group-hover:left-0" />
                </Link>
              </Fragment>
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
