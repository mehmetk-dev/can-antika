import Link from "next/link"
import Image from "next/image"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VintageSearch } from "@/components/ui/vintage-icons"
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
        <div className="absolute inset-x-0 top-0 h-full flex items-center px-4 bg-background/95 backdrop-blur z-50 sm:static sm:inset-auto sm:h-auto sm:px-0 sm:bg-transparent sm:z-auto gap-2">
            <div className="relative flex-1 sm:flex-none">
                <Input
                    type="search"
                    placeholder="Antika ara..."
                    className="w-full sm:w-64 bg-muted/50"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-background shadow-lg overflow-hidden w-full">
                        {searchResults.map((p) => (
                            <Link
                                key={p.id}
                                href={`/urun/${p.slug ?? p.id}`}
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
