import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LegalDocumentContent } from "@/components/legal/legal-document-content"
import {
    DISTANCE_SALES_SECTIONS,
    PRE_INFORMATION_SECTIONS,
    RETURN_POLICY_SECTIONS,
    type LegalDocumentSection,
} from "@/lib/legal/legal-documents"
import type { AddressResponse } from "@/lib/types"

interface LegalDocumentsPanelProps {
    selectedAddress?: AddressResponse | null
    cartTotal: number
    shippingAmount: number
    finalTotal: number
}

const formatPrice = (value: number) => `₺${value.toLocaleString("tr-TR")}`

function LegalTextBox({ title, href, items, children }: { title: string; href: string; items: LegalDocumentSection[]; children?: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <Link href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                    Tam metin
                </Link>
            </div>
            <div className="max-h-36 overflow-y-auto rounded-md bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
                {children}
                <LegalDocumentContent
                    sections={items}
                    sectionClassName="mt-3 first:mt-0"
                    headingClassName="font-semibold text-foreground/80"
                    paragraphClassName="mt-1"
                />
            </div>
        </section>
    )
}

export function LegalDocumentsPanel({ selectedAddress, cartTotal, shippingAmount, finalTotal }: LegalDocumentsPanelProps) {
    const today = new Intl.DateTimeFormat("tr-TR").format(new Date())
    const addressText = selectedAddress
        ? `${selectedAddress.addressLine}, ${[selectedAddress.neighborhood, selectedAddress.district, selectedAddress.city].filter(Boolean).join(", ")} ${selectedAddress.postalCode}`
        : "Sipariş için seçilecek teslimat adresi"

    return (
        <Card id="checkout-legal-documents" className="bg-card">
            <CardHeader className="border-b border-border/60">
                <CardTitle className="font-serif flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Sözleşmeler ve Formlar
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <LegalTextBox title="Ön Bilgilendirme Formu" href="/on-bilgilendirme-formu" items={PRE_INFORMATION_SECTIONS}>
                    <section className="mb-3">
                        <h4 className="font-semibold text-foreground/80">Siparişe Özel Tutarlar</h4>
                        <p className="mt-1">
                            Ara toplam: {formatPrice(cartTotal)}. Kargo: {shippingAmount > 0 ? formatPrice(shippingAmount) : "Ücretsiz"}.
                            Ödenecek toplam tutar: {formatPrice(finalTotal)}.
                        </p>
                    </section>
                </LegalTextBox>

                <LegalTextBox title="Mesafeli Satış Sözleşmesi" href="/mesafeli-satis-sozlesmesi" items={DISTANCE_SALES_SECTIONS}>
                    <section className="mb-3">
                        <h4 className="font-semibold text-foreground/80">Sipariş Bilgileri</h4>
                        <p className="mt-1">Sipariş tarihi: {today}</p>
                        <p className="mt-1">Teslimat adresi: {addressText}</p>
                    </section>
                </LegalTextBox>

                <LegalTextBox title="Cayma Hakkı" href="/iade" items={RETURN_POLICY_SECTIONS} />
            </CardContent>
        </Card>
    )
}
