"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSiteSettings } from "@/lib/site-settings-context"
import { categoryApi } from "@/lib/api"
import type { CategoryResponse } from "@/lib/types"

const footerLinks = {
  company: [
    { name: "Hakkımızda", href: "/hakkimizda" },
    { name: "Blog", href: "/blog" },
    { name: "SSS", href: "/sss" },
    { name: "Teslimat Bilgileri", href: "/teslimat" },
    { name: "İade Politikası", href: "/iade" },
    { name: "İletişim", href: "/iletisim" },
  ],
  legal: [
    { name: "Gizlilik Politikası", href: "/gizlilik" },
    { name: "KVKK Aydınlatma", href: "/kvkk" },
    { name: "Kullanım Koşulları", href: "/kullanim-kosullari" },
    { name: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
    { name: "Çerez Politikası", href: "/cerezler" },
  ],
}

function VintageCorner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none">
      <path d="M0 60V30C0 13.431 13.431 0 30 0h30" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M0 50V35C0 19.536 12.536 7 28 7h22" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.5" />
      <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="15" cy="45" r="1.5" fill="currentColor" opacity="0.2" />
      <circle cx="45" cy="15" r="1.5" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

function VintagePhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M12 2C8 2 6 4 6 8v4c0 2 1 3 3 3h1v5c0 1 1 2 2 2s2-1 2-2v-5h1c2 0 3-1 3-3V8c0-4-2-6-6-6z"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="2" fill="currentColor" opacity="0.3" />
      <path d="M9 12h6" strokeLinecap="round" />
      <path d="M8 2c-2 1-3 3-3 5" strokeLinecap="round" opacity="0.5" />
      <path d="M16 2c2 1 3 3 3 5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function VintageMailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 6l10 7 10-7" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
      <path d="M6 4V2M18 4V2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function VintageMapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M12 22v-2" strokeLinecap="round" opacity="0.5" />
      <path d="M8 21h8" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function VintageStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7L12 2z" />
    </svg>
  )
}

function VintageFacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M15 8h-2c-1.1 0-2 .9-2 2v10M9 13h6" strokeLinecap="round" />
    </svg>
  )
}

function VintageInstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  )
}

function VintageTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VintageYouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" opacity="0.3" stroke="none" />
    </svg>
  )
}

function VintageTikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Footer() {
  const settings = useSiteSettings()
  const [apiCategories, setApiCategories] = useState<CategoryResponse[]>([])

  useEffect(() => {
    categoryApi.getAll().then(setApiCategories).catch((e) => console.error("Kategori listesi alınamadı:", e))
  }, [])

  return (
    <footer className="relative border-t border-primary/20 bg-primary text-primary-foreground overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <VintageCorner className="absolute top-6 left-6 h-16 w-16 text-accent/20" />
      <VintageCorner className="absolute top-6 right-6 h-16 w-16 text-accent/20 -scale-x-100" />
      <VintageCorner className="absolute bottom-6 left-6 h-16 w-16 text-accent/20 -scale-y-100" />
      <VintageCorner className="absolute bottom-6 right-6 h-16 w-16 text-accent/20 scale-x-[-1] scale-y-[-1]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-accent/40" />
          <VintageStar className="h-5 w-5 text-accent/50" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="group inline-block">
              <div className="relative">
                <span className="font-serif text-3xl font-semibold tracking-tight text-primary-foreground">
                  {settings.storeName || "Can Antika"}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-px w-8 bg-gradient-to-r from-accent/60 to-transparent" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent">
                    {settings.businessType || "Antika"}
                  </span>
                  <span className="h-px w-8 bg-gradient-to-l from-accent/60 to-transparent" />
                </div>
              </div>
            </Link>

            <p className="mt-6 text-sm leading-relaxed text-primary-foreground/70">
              {settings.storeDescription || settings.footerAbout || "1990'dan beri kalite ve güven."}
            </p>

            <div className="mt-8 flex gap-4">
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 transition-all hover:border-accent hover:bg-accent/10"
                >
                  <VintageFacebookIcon className="h-5 w-5 text-primary-foreground/60 transition-colors group-hover:text-accent" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 transition-all hover:border-accent hover:bg-accent/10"
                >
                  <VintageInstagramIcon className="h-5 w-5 text-primary-foreground/60 transition-colors group-hover:text-accent" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {settings.twitter && (
                <a
                  href={settings.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 transition-all hover:border-accent hover:bg-accent/10"
                >
                  <VintageTwitterIcon className="h-5 w-5 text-primary-foreground/60 transition-colors group-hover:text-accent" />
                  <span className="sr-only">Twitter</span>
                </a>
              )}
              {settings.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 transition-all hover:border-accent hover:bg-accent/10"
                >
                  <VintageYouTubeIcon className="h-5 w-5 text-primary-foreground/60 transition-colors group-hover:text-accent" />
                  <span className="sr-only">YouTube</span>
                </a>
              )}
              {settings.tiktok && (
                <a
                  href={settings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 transition-all hover:border-accent hover:bg-accent/10"
                >
                  <VintageTikTokIcon className="h-5 w-5 text-primary-foreground/60 transition-colors group-hover:text-accent" />
                  <span className="sr-only">TikTok</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-primary-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 text-xs text-accent">
                I
              </span>
              Kategoriler
            </h3>
            <ul className="mt-6 space-y-3">
              {apiCategories.slice(0, 6).map((cat, index) => (
                <li key={cat.id}>
                  <Link
                    href={`/urunler?category=${encodeURIComponent(cat.name)}`}
                    className="group flex items-center gap-2 text-sm text-primary-foreground/60 transition-colors hover:text-accent"
                  >
                    <span className="text-[10px] text-primary-foreground/30 group-hover:text-accent/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border-b border-transparent group-hover:border-accent/30">{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-primary-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 text-xs text-accent">
                II
              </span>
              Kurumsal
            </h3>
            <ul className="mt-6 space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-primary-foreground/60 transition-colors hover:text-accent"
                  >
                    <span className="text-[10px] text-primary-foreground/30 group-hover:text-accent/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="border-b border-transparent group-hover:border-accent/30">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-primary-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 text-xs text-accent">
                III
              </span>
              Bülten
            </h3>
            <p className="mt-6 text-sm text-primary-foreground/60">
              Yeni gelen antikalardan ve özel fırsatlardan haberdar olun.
            </p>

            <form className="mt-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="w-full border-primary-foreground/20 bg-primary-foreground/5 pr-24 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-accent focus:ring-accent/20"
                  suppressHydrationWarning
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Abone Ol
                </Button>
              </div>
            </form>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5">
                  <VintagePhoneIcon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-primary-foreground/70">{settings.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5">
                  <VintageMailIcon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-primary-foreground/70">{settings.email || "—"}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5">
                  <VintageMapPinIcon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-primary-foreground/70">
                  {settings.address || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-primary-foreground/10 pt-8">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary-foreground/20" />
            <div className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-accent/40" />
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              <span className="h-1 w-1 rounded-full bg-accent/40" />
            </div>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary-foreground/20" />
          </div>

          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-primary-foreground/50">
              {settings.footerCopyright || `© ${new Date().getFullYear()} ${settings.storeName || "Can Antika"}. Tüm hakları saklıdır.`}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="group flex items-center gap-1 text-sm text-primary-foreground/50 transition-colors hover:text-accent"
                >
                  {index > 0 && <span className="mr-4 text-primary-foreground/20">•</span>}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
