"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Loader2, HelpCircle, ChevronDown } from "lucide-react"
import { faqApi } from "@/lib/api"
import Link from "next/link"

interface FaqItem {
    id: number
    question: string
    answer: string
    sortOrder: number
    active: boolean
}

export default function FaqPage() {
    const [faqs, setFaqs] = useState<FaqItem[]>([])
    const [loading, setLoading] = useState(true)
    const [openItems, setOpenItems] = useState<Set<number>>(new Set())

    useEffect(() => {
        loadFaqs()
    }, [])

    const loadFaqs = async () => {
        try {
            const data = await faqApi.getActive()
            setFaqs(data || [])
        } catch {
            // Silently handle
        } finally {
            setLoading(false)
        }
    }

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
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero */}
                <section className="relative py-28 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/90" />
                    <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/20 pointer-events-none" />

                    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-16 h-px bg-accent/50" />
                            <div className="w-2 h-2 rotate-45 border border-accent/50" />
                            <div className="w-16 h-px bg-accent/50" />
                        </div>

                        <span className="inline-block font-serif text-accent text-lg tracking-widest uppercase mb-4">
                            Yardım
                        </span>

                        <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary-foreground leading-tight">
                            Sıkça Sorulan Sorular
                        </h1>

                        <p className="mt-6 text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
                            Merak ettikleriniz ve sıkça karşılaştığımız soruların yanıtları
                        </p>

                        <div className="flex items-center justify-center gap-4 mt-10">
                            <div className="w-24 h-px bg-accent/50" />
                            <div className="w-3 h-3 rotate-45 bg-accent/30" />
                            <div className="w-24 h-px bg-accent/50" />
                        </div>
                    </div>
                </section>

                {/* FAQ Content */}
                <section className="py-16">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Footer />
        </div>
    )
}
