import Link from "next/link"
import { MapPin, Plus, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AddressResponse } from "@/lib/types"

interface AddressSelectorProps {
    addresses: AddressResponse[]
    selectedAddressId: number | null
    onSelect: (id: number) => void
}

export function AddressSelector({ addresses, selectedAddressId, onSelect }: AddressSelectorProps) {
    return (
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10 rounded-[2px] shadow-[0_4px_24px_rgba(123,64,25,0.02)] transition-all duration-300">
            <CardHeader className="border-b border-primary/5 pb-4">
                <CardTitle className="font-cinzel text-lg tracking-wider text-primary flex items-center gap-2.5">
                    <MapPin className="h-4.5 w-4.5 text-primary/70" />
                    TESLİMAT ADRESİ
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {addresses.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-primary/20 rounded-[2px] bg-background/30">
                        <p className="text-muted-foreground font-serif text-sm italic mb-4">Kayıtlı adresiniz bulunmamaktadır.</p>
                        <Link href="/hesap/adresler">
                            <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/50 text-primary rounded-[2px] font-serif hover:bg-primary/5">
                                <Plus className="h-4 w-4" />
                                Yeni Adres Ekle
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id
                            return (
                                <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => onSelect(addr.id)}
                                    className={`relative rounded-[2px] border p-5 text-left transition-all duration-300 group cursor-pointer ${
                                        isSelected
                                            ? "border-primary bg-gradient-to-br from-amber-50/15 via-primary/[0.01] to-primary/[0.04] shadow-[0_8px_20px_rgba(123,64,25,0.06)]"
                                            : "border-primary/10 bg-background/40 hover:border-primary/40 hover:bg-background/80 hover:shadow-[0_4px_12px_rgba(123,64,25,0.03)] hover:-translate-y-0.5"
                                    }`}
                                >
                                    {/* Selection Seal Marker */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in-50 duration-200">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}

                                    <p className={`font-serif text-base font-semibold transition-colors duration-300 ${
                                        isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                                    }`}>
                                        {addr.title}
                                    </p>
                                    <p className="mt-2 text-sm text-foreground/80 leading-relaxed font-sans">{addr.addressLine}</p>
                                    <p className="text-xs text-muted-foreground/90 font-sans mt-1">
                                        {[addr.neighborhood, addr.district, addr.city].filter(Boolean).join(", ")} {addr.postalCode}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-primary/5 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-sans">
                                            Telefon: <span className="text-foreground/70 font-medium">{addr.phone || "Eklenmemiş"}</span>
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
