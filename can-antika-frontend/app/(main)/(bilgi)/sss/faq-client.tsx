"use client"

import { useState, useEffect } from "react"
import { HelpCircle, ChevronDown, Loader2 } from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/layout/page-hero"
import type { FaqItem } from "@/lib/types"
import { faqApi } from "@/lib/api"

interface FaqClientProps {
    initialFaqs: FaqItem[]
}

export function FaqClient({ initialFaqs }: FaqClientProps) {
    const [openItems, setOpenItems] = useState<Set<number>>(new Set())
    const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs)
    const [isLoading, setIsLoading] = useState(initialFaqs.length === 0)

    useEffect(() => {
        if (initialFaqs.length === 0) {
            async function fetchFaqs() {
                try {
                    const res = await faqApi.getActive();
                    if (Array.isArray(res)) {
                        setFaqs([...res].sort((a, b) => a.displayOrder - b.displayOrder));
                    }
                } catch (error) {
                    console.error("Client-side fallback Faq fetch error:", error);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchFaqs();
        }
    }, [initialFaqs.length]);

    const toggleItem = (id: number) => {
        setOpenItems((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <div className="bg-background">
            <main>
                <PageHero
                    imageSrc="/sss-hero.png"
                    imageAlt="Sıkça Sorulan Sorular"
                    eyebrow="Yardım"
                    title="Sıkça Sorulan Sorular"
                    description="Merak ettikleriniz ve sıkça karşılaştığımız soruların yanıtları"
                    priority
                />

                {/* FAQ Content */}
                <section className="py-16">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        {isLoading ? (
                            <div className="text-center py-24 flex flex-col items-center justify-center">
                                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                <h3 className="font-serif text-lg text-foreground">Sorular yükleniyor...</h3>
                            </div>
                        ) : faqs.length === 0 ? (
                            <div className="text-center py-24">
                                <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="font-serif text-xl text-foreground">Henüz SSS eklenmemiş</h3>
                                <p className="text-muted-foreground mt-2">
                                    Sorularınız için bizimle iletişime geçebilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {faqs.map((faq) => {
                                    const isOpen = openItems.has(faq.id)
                                    return (
                                        <div
                                            key={faq.id}
                                            className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                                        >
                                            <button
                                                onClick={() => toggleItem(faq.id)}
                                                className="w-full flex items-center justify-between p-6 text-left"
                                                id={`faq-item-${faq.id}`}
                                            >
                                                <span className="font-serif text-lg font-medium text-foreground pr-4">
                                                    {faq.question}
                                                </span>
                                                <ChevronDown
                                                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                                    }`}
                                            >
                                                <div className="px-6 pb-6 pt-0">
                                                    <div className="w-full h-px bg-border mb-4" />
                                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-10 text-center">
                            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
                            <h3 className="font-serif text-2xl font-semibold text-foreground">
                                Sorunuz mu var?
                            </h3>
                            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                                Cevabını bulamadığınız bir sorunuz varsa, bizimle doğrudan iletişime geçmekten çekinmeyin.
                            </p>
                            <Link
                                href="/iletisim"
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                id="faq-contact-link"
                            >
                                İletişime Geçin
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
