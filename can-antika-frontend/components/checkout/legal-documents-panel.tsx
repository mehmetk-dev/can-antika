import Link from "next/link"
import { FileText, ExternalLink } from "lucide-react"
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
        <section className="space-y-2 group">
            <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-xs font-semibold text-primary uppercase font-serif tracking-wider">{title}</h3>
                <Link href={href} target="_blank" rel="noopener noreferrer" className="text-xxs font-medium text-primary hover:text-accent flex items-center gap-1 transition-colors duration-200 underline underline-offset-2">
                    TAM METİN
                    <ExternalLink className="h-2.5 w-2.5" />
                </Link>
            </div>
            <div className="max-h-36 overflow-y-auto rounded-[2px] border border-primary/5 bg-gradient-to-b from-amber-50/[0.04] to-primary/[0.02] px-4 py-3.5 text-xxs leading-relaxed text-foreground/75 font-sans scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {children}
                <LegalDocumentContent
                    sections={items}
                    sectionClassName="mt-3.5 first:mt-0"
                    headingClassName="font-semibold text-primary/80 font-serif"
                    paragraphClassName="mt-1 leading-relaxed text-justify"
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
        <Card id="checkout-legal-documents" className="bg-card/40 backdrop-blur-sm border-primary/10 rounded-[2px] shadow-[0_4px_24px_rgba(123,64,25,0.02)] transition-all duration-300">
            <CardHeader className="border-b border-primary/5 pb-4">
                <CardTitle className="font-cinzel text-lg tracking-wider text-primary flex items-center gap-2.5">
                    <FileText className="h-4.5 w-4.5 text-primary/70" />
                    SÖZLEŞMELER VE FORMLAR
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <LegalTextBox title="Ön Bilgilendirme Formu" href="/on-bilgilendirme-formu" items={PRE_INFORMATION_SECTIONS}>
                    <section className="mb-3.5 border-b border-primary/5 pb-2">
                        <h4 className="font-semibold text-primary/80 font-serif mb-1">Siparişe Özel Tutarlar</h4>
                        <p className="leading-relaxed">
                            Ara toplam: <span className="font-semibold text-foreground">{formatPrice(cartTotal)}</span>. Kargo: <span className="font-semibold text-foreground">{shippingAmount > 0 ? formatPrice(shippingAmount) : "Ücretsiz"}</span>.
                            Ödenecek toplam tutar: <span className="font-semibold text-primary">{formatPrice(finalTotal)}</span>.
                        </p>
                    </section>
                </LegalTextBox>

                <LegalTextBox title="Mesafeli Satış Sözleşmesi" href="/mesafeli-satis-sozlesmesi" items={DISTANCE_SALES_SECTIONS}>
                    <section className="mb-3.5 border-b border-primary/5 pb-2">
                        <h4 className="font-semibold text-primary/80 font-serif mb-1">Sipariş Bilgileri</h4>
                        <p className="leading-relaxed">Sipariş tarihi: <span className="font-semibold text-foreground">{today}</span></p>
                        <p className="leading-relaxed mt-1">Teslimat adresi: <span className="font-semibold text-foreground">{addressText}</span></p>
                    </section>
                </LegalTextBox>

                <LegalTextBox title="Cayma Hakkı" href="/iade" items={RETURN_POLICY_SECTIONS} />
            </CardContent>
        </Card>
    )
}

