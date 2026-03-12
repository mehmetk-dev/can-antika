import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { VintageUser, VintagePhone, VintageMenuIcon, VintageCorner } from "@/components/ui/vintage-icons"

interface MobileMenuProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    navigation: { name: string; href: string; description: string }[]
    isAuthenticated: boolean
}

export function MobileMenu({ isOpen, onOpenChange, navigation, isAuthenticated }: MobileMenuProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/5">
                    <VintageMenuIcon className="h-6 w-6" />
                    <span className="sr-only">Menüyü aç</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-80 border-r-2 border-primary/20 bg-[#fdf8f1] p-0 z-50 shadow-[10px_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-0"
            >
                <SheetTitle className="sr-only">Navigasyon Menüsü</SheetTitle>
                <SheetDescription className="sr-only">Site içindeki sayfalara ve kategorilere ulaşmak için navigasyon menüsü.</SheetDescription>

                {/* Vintage paper texture overlay */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                    }}
                />

                {/* Decorative corners */}
                <VintageCorner className="absolute top-4 left-4 h-10 w-10 text-primary/30 z-[1]" />
                <VintageCorner className="absolute top-4 right-4 h-10 w-10 text-primary/30 -scale-x-100 z-[1]" />
                <VintageCorner className="absolute bottom-4 left-4 h-10 w-10 text-primary/30 -scale-y-100 z-[1]" />
                <VintageCorner className="absolute bottom-4 right-4 h-10 w-10 text-primary/30 scale-x-[-1] scale-y-[-1] z-[1]" />

                {/* Header with logo */}
                <div className="mobile-menu-header relative shrink-0 border-b border-primary/10 px-6 py-8 z-[2]">
                    <div className="text-center">
                        <span className="font-serif text-2xl font-semibold tracking-tight text-primary">Can Antika</span>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Est. 1990</span>
                            <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="relative flex-1 overflow-y-auto px-6 py-8 z-[2]">
                    <div className="space-y-2">
                        {navigation.map((item, index) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => onOpenChange(false)}
                                className="mobile-menu-item group relative block rounded-lg border border-transparent px-4 py-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5"
                                style={{ animationDelay: `${0.1 + index * 0.06}s` }}
                            >
                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 font-serif text-3xl font-light text-primary/10 transition-colors group-hover:text-primary/20">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="ml-6">
                                    <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                                        {item.name}
                                    </span>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                                </div>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/0 transition-all duration-300 group-hover:text-primary/60 group-hover:translate-x-1">
                                    →
                                </span>
                            </Link>
                        ))}

                        {isAuthenticated && (
                            <Link
                                href="/hesap/siparisler"
                                onClick={() => onOpenChange(false)}
                                className="mobile-menu-item group relative block rounded-lg border border-transparent px-4 py-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5"
                                style={{ animationDelay: `${0.1 + navigation.length * 0.06}s` }}
                            >
                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 font-serif text-3xl font-light text-primary/10 transition-colors group-hover:text-primary/20">
                                    04
                                </span>
                                <div className="ml-6">
                                    <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">
                                        Siparişlerim
                                    </span>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Decorative divider */}
                    <div className="my-8 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <svg className="h-4 w-4 text-primary/30" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7L12 2z" />
                        </svg>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>

                    {/* Account & Contact buttons */}
                    <div className="mobile-menu-item space-y-3" style={{ animationDelay: '0.35s' }}>
                        <Link
                            href="/hesap"
                            onClick={() => onOpenChange(false)}
                            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:bg-primary/10"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30">
                                <VintageUser className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">Hesabım</span>
                        </Link>

                        <Link
                            href="/iletisim"
                            onClick={() => onOpenChange(false)}
                            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 transition-all hover:bg-primary/10"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30">
                                <VintagePhone className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">İletişim</span>
                        </Link>
                    </div>
                </nav>

                {/* Footer */}
                <div className="mobile-menu-footer relative mt-auto shrink-0 border-t border-primary/10 bg-muted/20 px-6 py-4 z-[2]">
                    <p className="text-center text-xs text-muted-foreground">
                        <span className="font-serif italic">&quot;Geçmişin izinde, geleceğe miras&quot;</span>
                    </p>
                    <p className="mt-1 text-center text-[10px] text-muted-foreground/60">Çukurcuma, Beyoğlu - İstanbul</p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
