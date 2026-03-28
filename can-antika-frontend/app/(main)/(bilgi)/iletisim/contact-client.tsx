"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Send, MessageCircle } from "lucide-react"
import { VintageLocationIcon, VintagePhoneIcon, VintageMailIcon, VintageClockIcon } from "@/components/ui/vintage-icons"
import { PageHero } from "@/components/layout/page-hero"

import { toast } from "sonner"
import { contactApi } from "@/lib/api"
import { useSiteSettings } from "@/lib/site-settings-context"

export function ContactClient() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const settings = useSiteSettings()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side rate limiting
    const RATE_LIMIT_KEY = "contact_last_submit"
    const RATE_LIMIT_MS = 60_000 // 1 min between submissions
    const lastSubmit = Number(sessionStorage.getItem(RATE_LIMIT_KEY) || "0")
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      toast.error("Lütfen bir dakika bekleyip tekrar deneyin")
      return
    }

    const form = new FormData(e.currentTarget)
    const name = (form.get("name") ?? "").toString().trim()
    const phone = (form.get("phone") ?? "").toString().trim()
    const email = (form.get("email") ?? "").toString().trim()
    const message = (form.get("message") ?? "").toString().trim()

    if (!name || !email || !message) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSubmitting(true)
    try {
      await contactApi.submit({
        name,
        email,
        phone,
        subject: "İletişim Formu",
        message,
      })
      sessionStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
      setIsSubmitted(true)
      toast.success("Mesajınız başarıyla gönderildi")
    } catch {
      toast.error("Mesaj gönderilemedi, lütfen tekrar deneyin")
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappNumber = (settings.whatsapp || settings.phone || "").replace(/[^0-9]/g, "")

  const contactItems = [
    { Icon: VintageLocationIcon, label: "Adres", value: settings.address || "—" },
    { Icon: VintagePhoneIcon, label: "Telefon", value: settings.phone || "—" },
    { Icon: VintageMailIcon, label: "E-posta", value: settings.email || "—" },
    { Icon: VintageClockIcon, label: "Çalışma", value: `Pzt-Cum: ${settings.weekdayHours || "–"} / Cmt: ${settings.saturdayHours || "–"}` },
  ]

  return (
    <div className="bg-background">
      <main>
        <PageHero
          imageSrc="/vintage-antique-shop-storefront-istanbul-sepia-ton.jpg"
          imageAlt="İletişim"
          eyebrow="İletişim"
          title="İletişim"
          description="Sorularınız için buradayız"
        />

        <section className="py-20 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Left - Antique Style Contact Cards */}
              <div className="lg:col-span-2 space-y-5">
                {contactItems.map((item) => (
                  <div
                    key={item.label}
                    className="relative p-6 bg-gradient-to-br from-[#faf6f0] to-[#f5ede0] border border-[#d4c4a8] shadow-sm hover:shadow-md transition-all group"
                  >
                    {/* Decorative corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent/60" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent/60" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent/60" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent/60" />

                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#f9f5ec] border-2 border-[#c9b896] rounded-full group-hover:border-accent group-hover:bg-accent/10 transition-all shadow-inner">
                        <div className="text-primary group-hover:text-accent transition-colors">
                          <item.Icon />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-primary/60 uppercase tracking-[0.2em] font-medium">{item.label}</p>
                        <p className="font-serif text-lg text-foreground mt-1">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* WhatsApp - Antique style */}
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium transition-colors overflow-hidden"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-serif tracking-wide">WhatsApp ile Ulaşın</span>
                  </a>
                )}
              </div>

              {/* Right - Form */}
              <div className="lg:col-span-3 relative">
                <div className="absolute inset-0 -z-10 opacity-[0.06]">
                  <Image
                    src="/vintage-antique-shop-storefront-istanbul-sepia-ton.jpg"
                    alt=""
                    role="presentation"
                    fill
                    sizes="75vw"
                    className="object-cover"
                  />
                </div>

                <div className="bg-card/95 backdrop-blur-sm border border-border p-8 lg:p-10">
                  <div className="mb-8">
                    <h2 className="font-serif text-2xl font-semibold text-foreground">Mesaj Gönderin</h2>
                    <p className="mt-1 text-muted-foreground text-sm">En kısa sürede dönüş yapacağız</p>
                  </div>

                  {isSubmitted ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                        <CheckCircle className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">Teşekkürler!</h3>
                      <p className="mt-2 text-muted-foreground text-sm">Mesajınız bize ulaştı.</p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-5">
                        Yeni Mesaj
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm">
                            Ad Soyad
                          </Label>
                          <Input id="name" name="name" placeholder="Adınız" required maxLength={100} className="h-11" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-sm">
                            Telefon
                          </Label>
                          <Input id="phone" name="phone" type="tel" placeholder="05XX XXX XX XX" required maxLength={20} pattern="[0-9\s\+\-\(\)]{7,20}" className="h-11" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">
                          E-posta
                        </Label>
                        <Input id="email" name="email" type="email" placeholder="ornek@email.com" required maxLength={254} className="h-11" />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-sm">
                          Mesajınız
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Mesajınızı yazın..."
                          rows={5}
                          required
                          maxLength={2000}
                          className="resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="relative h-[350px]">
          <Image
            src="/istanbul-cukurcuma-beyoglu-antique-district-aerial.jpg"
            alt="Konum"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/30" />

          <div className="absolute bottom-6 left-6 bg-card p-5 shadow-lg max-w-xs">
            <div className="flex items-start gap-3">
              <div className="text-primary shrink-0 mt-0.5">
                <VintageLocationIcon />
              </div>
              <div>
                <p className="font-serif font-semibold text-foreground">{settings.storeName || "Can Antika"}</p>
                <p className="text-sm text-muted-foreground mt-1">{settings.address || "—"}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.storeName || "Can Antika")}+${encodeURIComponent(settings.address || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm font-medium text-primary hover:text-accent transition-colors"
                >
                  Yol tarifi al →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}