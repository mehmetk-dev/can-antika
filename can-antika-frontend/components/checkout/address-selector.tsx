import Link from "next/link"
import { MapPin, Plus } from "lucide-react"
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
        <Card className="bg-card">
            <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Teslimat Adresi
                </CardTitle>
            </CardHeader>
            <CardContent>
                {addresses.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground mb-3">Kayıtlı adresiniz yok</p>
                        <Link href="/hesap/adresler">
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adres Ekle
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {addresses.map((addr) => (
                            <button
                                key={addr.id}
                                type="button"
                                onClick={() => onSelect(addr.id)}
                                className={`rounded-lg border p-4 text-left transition-all ${selectedAddressId === addr.id
                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <p className="font-medium text-foreground">{addr.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{addr.addressLine}</p>
                                <p className="text-sm text-muted-foreground">
                                    {addr.district}, {addr.city} {addr.postalCode}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
