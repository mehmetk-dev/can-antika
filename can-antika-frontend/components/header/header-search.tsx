import Link from "next/link"
import Image from "next/image"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VintageSearch } from "@/components/ui/vintage-icons"
import { getProductUrl } from "@/lib/product/product-url"
import { useProductSearch } from "@/hooks/useProductSearch"

interface HeaderSearchProps {
    isSearchOpen: boolean
    setIsSearchOpen: (open: boolean) => void
}

export function HeaderSearch({ isSearchOpen, setIsSearchOpen }: HeaderSearchProps) {
    const router = useRouter()
    const { searchQuery, setSearchQuery, searchResults, clearSearch } = useProductSearch()

    const handleClose = () => {
        setIsSearchOpen(false)
        clearSearch()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            router.push(`/urunler?q=${encodeURIComponent(searchQuery.trim())}`)
            handleClose()
        }
    }

    if (!isSearchOpen) {
        return (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="text-foreground hover:text-primary transition-colors">
                <VintageSearch className="h-7 w-7" />
                <span className="sr-only">Ara</span>
            </Button>
        )
    }

    return (
        <div className="absolute inset-x-0 top-full z-50 flex items-center gap-2 border-t border-primary/10 bg-background/95 px-4 py-3 shadow-[0_12px_30px_rgba(32,25,18,0.08)] backdrop-blur sm:px-6 lg:px-8">
            <div className="relative mx-auto max-w-2xl flex-1">
                <Input
                    type="search"
                    placeholder="Antika ara..."
                    className="h-11 w-full rounded-[2px] border-primary/15 bg-muted/35"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-hidden rounded-[2px] border border-primary/10 bg-background shadow-xl">
                        {searchResults.map((p) => (
                            <Link
                                key={p.id}
                                href={getProductUrl(p)}
                                prefetch={false}
                                onClick={handleClose}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                            >
                                <Image
                                    src={p.imageUrls?.[0] || "/placeholder.svg"}
                                    alt={p.title}
                                    width={40}
                                    height={40}
                                    className="rounded object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                                    <p className="text-xs text-primary font-semibold">₺{p.price.toLocaleString("tr-TR")}</p>
                                </div>
                            </Link>
                        ))}
                        <Link
                            href={`/urunler?q=${encodeURIComponent(searchQuery.trim())}`}
                            prefetch={false}
                            onClick={handleClose}
                            className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted transition-colors"
                        >
                            Tüm sonuçları gör →
                        </Link>
                    </div>
                )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-foreground shrink-0">
                <X className="h-5 w-5" />
                <span className="sr-only">Aramayı Kapat</span>
            </Button>
        </div>
    )
}
