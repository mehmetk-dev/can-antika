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

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, "")}` : ""
  const mailHref = settings.email ? `mailto:${settings.email}` : ""

  const contactItems = [
    { Icon: VintageLocationIcon, label: "Adres", value: settings.address || "—", href: "" },
    { Icon: VintagePhoneIcon, label: "Telefon", value: settings.phone || "—", href: phoneHref },
    { Icon: VintageMailIcon, label: "E-posta", value: settings.email || "—", href: mailHref },
    { Icon: VintageClockIcon, label: "Çalışma", value: `Pzt-Cum: ${settings.weekdayHours || "–"} / Cmt: ${settings.saturdayHours || "–"}`, href: "" },
  ]

  return (
    <div className="bg-background">
      <main>
        <PageHero
          imageSrc="/vintage-antique-shop-storefront-istanbul-sepia-ton.jpg"
          imageAlt="İletişim"
          eyebrow="Bize Ulaşın"
          title="İletişim"
          description="Sorularınız için buradayız"
        />

        <section className="bg-muted/20 pb-0 pt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-stretch gap-8 lg:grid-cols-5">
              {/* Sol Taraf - İletişim Bilgileri (Form ile aynı boyda olması için flex-col h-full) */}
              <div className="flex flex-col gap-5 lg:col-span-2">
                <div className="flex flex-col gap-5 h-full">
                  {contactItems.map((item) => (
                    <div
                      key={item.label}
                      className="group relative flex-1 border border-[#d4c4a8] bg-gradient-to-br from-[#faf6f0] to-[#f5ede0] p-6 shadow-sm transition-all hover:shadow-md"
                    >
                      {/* Dekoratif Köşeler */}
                      <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-accent/60" />
                      <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-accent/60" />
                      <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-accent/60" />
                      <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-accent/60" />

                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#c9b896] bg-[#f9f5ec] shadow-inner transition-all group-hover:border-accent group-hover:bg-accent/10">
                          <div className="text-primary transition-colors group-hover:text-accent">
                            <item.Icon />
                          </div>
                        </div>
                        <div>
                          <p className="font-cinzel text-[10px] font-bold uppercase tracking-[0.25em] text-accent/80">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="mt-1 block font-serif text-lg text-foreground hover:text-accent transition-colors">
                              {item.value}
                            </a>
                          ) : (
                            <p className="mt-1 font-serif text-lg text-foreground">{item.value}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* WhatsApp - Tasarımsal ve Şık */}
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center gap-3 border border-[#25D366]/40 bg-[#25D366]/5 py-5 transition-all hover:bg-[#25D366] hover:text-white"
                    >
                      <div className="absolute inset-1 border border-[#25D366]/20 transition-all group-hover:border-white/40" />
                      <MessageCircle className="h-5 w-5 text-[#25D366] group-hover:text-white" />
                      <span className="font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-[#25D366] group-hover:text-white">
                        WhatsApp ile Ulaşın
                      </span>
                    </a>
                  )}

                </div>
              </div>

              {/* Sağ Taraf - Form (Derinleştirilmiş Antik Hava) */}
              <div className="relative lg:col-span-3">
                <div className="group relative h-full border border-[#d4c4a8] bg-gradient-to-br from-[#faf6f0] to-[#f5ede0] p-8 shadow-sm lg:p-12">
                  {/* Dekoratif Köşeler */}
                  <div className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-accent/40" />
                  <div className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-accent/40" />
                  <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-accent/40" />
                  <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-accent/40" />
                  
                  {/* Arka Plan Dokusu */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l30 30-30 30L0 30z\' fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />

                  <div className="relative mb-10">
                    <h2 className="font-cinzel text-3xl font-bold tracking-tight text-foreground">Mesaj <span className="text-accent italic">Gönderin</span></h2>
                    <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">En kısa sürede dönüş yapacağız</p>
                    <div className="mt-4 h-px w-20 bg-accent/30" />
                  </div>

                  {isSubmitted ? (
                    <div className="flex h-[300px] flex-col items-center justify-center text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mt-6 font-cinzel text-2xl font-bold text-foreground">Teşekkürler!</h3>
                      <p className="mt-2 text-sm font-medium text-muted-foreground">Mesajınız başarıyla iletilmiştir.</p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-8 font-cinzel text-xs font-bold uppercase tracking-widest">
                        Yeni Mesaj
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="relative space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            Ad Soyad
                          </Label>
                          <Input id="name" name="name" placeholder="Adınız" required maxLength={100} className="h-12 border-accent/20 bg-[#f9f5ec] focus:border-accent" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            Telefon
                          </Label>
                          <Input id="phone" name="phone" type="tel" placeholder="05XX XXX XX XX" required maxLength={20} pattern="[0-9\s\+\-\(\)]{7,20}" className="h-12 border-accent/20 bg-[#f9f5ec] focus:border-accent" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-primary/70">
                          E-posta
                        </Label>
                        <Input id="email" name="email" type="email" placeholder="ornek@email.com" required maxLength={254} className="h-12 border-accent/20 bg-[#f9f5ec] focus:border-accent" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-primary/70">
                          Mesajınız
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Mesajınızı buraya yazın..."
                          rows={4}
                          required
                          maxLength={2000}
                          className="resize-none border-accent/20 bg-[#f9f5ec] focus:border-accent"
                        />
                      </div>

                      <Button type="submit" className="group relative h-14 w-full overflow-hidden bg-primary px-8 transition-all hover:bg-primary/90" disabled={isSubmitting}>
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] transition-[background-position] duration-1000 group-hover:bg-[position:-200%_0,0_0]" />
                        <Send className="mr-3 h-4 w-4 text-accent" />
                        <span className="relative font-cinzel text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground">
                          {isSubmitting ? "Gönderiliyor..." : "Mesajı Gönder"}
                        </span>
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Harita ve Konum - Antika Eser Görünümü */}
        <section className="relative w-full bg-muted/20 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <div className="group relative h-[500px] w-full overflow-hidden shadow-2xl lg:h-[650px]">
              {/* Dekoratif Dış Çerçeve */}
              <div className="pointer-events-none absolute inset-0 z-20 border-[12px] border-accent/5 lg:border-[20px]" />
              <div className="pointer-events-none absolute inset-1 z-20 border border-accent/40 lg:inset-2" />
              
              <Image
                src="/istanbul-cukurcuma-beyoglu-antique-district-aerial.jpg"
                alt="Konum Haritası"
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                style={{ filter: "sepia(0.2) contrast(1.1) brightness(0.85)" }}
              />

              {/* Antika Kaplamalar (Overlay) */}
              <div className="pointer-events-none absolute inset-0 bg-primary/20 mix-blend-multiply" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              
              {/* Eskitme Doku (SVG Noise) */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

              {/* Adres Plaketi (Antique Plaque) */}
              <div className="absolute bottom-8 left-8 z-30 max-w-xs scale-90 sm:bottom-12 sm:left-12 sm:scale-100">
                <div className="relative overflow-hidden border border-accent/40 bg-[#fdfaf5] p-6 shadow-2xl">
                  {/* Köşe Süsleri */}
                  <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-accent/60" />
                  <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-accent/60" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-accent/60" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-accent/60" />
                  
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 text-accent">
                      <VintageLocationIcon />
                    </div>
                    <div>
                      <p className="font-cinzel text-lg font-bold tracking-wide text-primary">Can Antika</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-primary/80">{settings.address || "—"}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.storeName || "Can Antika")}+${encodeURIComponent(settings.address || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex border-b border-accent/30 font-cinzel text-xs font-bold uppercase tracking-widest text-accent transition-colors hover:text-primary"
                      >
                        Yol tarifi al
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
