"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { categoryApi } from "@/lib/api"
import { useSiteSettings } from "@/lib/site-settings-context"
import type { CategoryResponse } from "@/lib/types"

const footerLinks = {
  company: [
    { name: "Ürünler", href: "/urunler" },
    { name: "Hakkımızda", href: "/hakkimizda" },
    { name: "Blog", href: "/blog" },
    { name: "SSS", href: "/sss" },
    { name: "İletişim", href: "/iletisim" },
    { name: "Teslimat / Kargo", href: "/teslimat" },
    { name: "İade / İptal / Cayma", href: "/iade" },
  ],
  legal: [
    { name: "KVKK Aydınlatma Metni", href: "/kvkk" },
    { name: "Gizlilik Politikası", href: "/gizlilik" },
    { name: "Çerez Politikası", href: "/cerezler" },
    { name: "Kullanım Koşulları", href: "/kullanim-kosullari" },
    { name: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
  ],
}

function SocialIcon({ type }: { type: "facebook" | "instagram" | "twitter" | "youtube" | "tiktok" }) {
  if (type === "facebook") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 8h-2a2 2 0 0 0-2 2v10" strokeLinecap="round" />
        <path d="M8 13h6" strokeLinecap="round" />
        <rect x="2" y="2" width="20" height="20" rx="4" />
      </svg>
    )
  }
  if (type === "instagram") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="6" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (type === "twitter") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 5.8a8.2 8.2 0 0 1-2.3.7 4 4 0 0 0-7 2.7v.8A10.4 10.4 0 0 1 4 6s-2.8 5.7 3.2 8.4A10.8 10.8 0 0 1 2 15.9c6 3.3 13.3.6 16-5.4a12 12 0 0 0 1-4.7c0-.1 0-.2 0-.3.8-.5 1.5-1 2-1.7Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === "youtube") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12s0-3-1-4c-1-1-3.8-1-9-1s-8 .1-9 1c-1 1-1 4-1 4s0 3 1 4c1 1 3.8 1 9 1s8-.1 9-1c1-1 1-4 1-4Z" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11.5a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M6 114V64C6 31 31 6 64 6h50" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 106V68C14 40 36 14 64 14h38" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      <path d="M22 98V72c0-22 18-40 40-40h26" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
      <circle cx="64" cy="64" r="4" fill="currentColor" opacity="0.45" />
      <circle cx="40" cy="88" r="2.5" fill="currentColor" opacity="0.35" />
      <circle cx="88" cy="40" r="2.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

export function Footer() {
  const settings = useSiteSettings()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

  useEffect(() => {
    categoryApi
      .getAll()
      .then((items) => setCategories(items.slice(0, 6)))
      .catch(() => setCategories([]))
      .finally(() => setIsCategoriesLoading(false))
  }, [])

  const socialLinks = useMemo(
    () => [
      { key: "facebook" as const, href: settings.facebook },
      { key: "instagram" as const, href: settings.instagram },
      { key: "twitter" as const, href: settings.twitter },
      { key: "youtube" as const, href: settings.youtube },
      { key: "tiktok" as const, href: settings.tiktok },
    ].filter((item) => Boolean(item.href)),
    [settings.facebook, settings.instagram, settings.twitter, settings.youtube, settings.tiktok]
  )

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, "")}` : ""
  const mailHref = settings.email ? `mailto:${settings.email}` : ""
  const mapHref = "https://maps.app.goo.gl/Sv4bqXDK7164WQGR9"
  const hasCategories = categories.length > 0

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-primary-foreground/10 bg-primary text-primary-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d1a46e' stroke-opacity='0.6' stroke-width='1'%3E%3Crect x='10' y='10' width='100' height='100'/%3E%3Crect x='28' y='28' width='64' height='64'/%3E%3Cpath d='M10 60h100M60 10v100'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "120px 120px",
          backgroundPosition: "0 0",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-32 left-[-10%] h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 right-[-10%] h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <CornerOrnament className="pointer-events-none absolute left-5 top-5 h-20 w-20 text-accent/30" />
      <CornerOrnament className="pointer-events-none absolute right-5 top-5 h-20 w-20 -scale-x-100 text-accent/30" />
      <CornerOrnament className="pointer-events-none absolute bottom-5 left-5 h-20 w-20 -scale-y-100 text-accent/30" />
      <CornerOrnament className="pointer-events-none absolute bottom-5 right-5 h-20 w-20 scale-x-[-1] scale-y-[-1] text-accent/30" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div
          className={`grid gap-10 border-b border-primary-foreground/10 pb-10 md:grid-cols-2 xl:gap-8 ${
            hasCategories ? "xl:grid-cols-4" : "xl:grid-cols-3"
          }`}
        >
          <div>
            <Link href="/" className="inline-block">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-primary-foreground">{settings.storeName || "Can Antika"}</h2>
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-px w-8 bg-gradient-to-r from-accent/60 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-accent">{settings.businessType || "Antika Eşya Satışı"}</span>
              <span className="h-px w-8 bg-gradient-to-l from-accent/60 to-transparent" />
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/75">
              {settings.storeDescription || settings.footerAbout || "Nadir parçaları güvenli alışveriş deneyimiyle koleksiyonerlerle buluşturuyoruz."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-primary-foreground/75">
              {settings.phone ? (
                <a href={phoneHref} className="block transition-colors hover:text-accent">
                  {settings.phone}
                </a>
              ) : (
                <p>—</p>
              )}
              {settings.email ? (
                <a href={mailHref} className="block transition-colors hover:text-accent">
                  {settings.email}
                </a>
              ) : (
                <p>—</p>
              )}
              {settings.address ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-md transition-colors hover:text-accent"
                >
                  {settings.address}
                </a>
              ) : (
                <p className="max-w-md">—</p>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/70 transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                  >
                    <SocialIcon type={social.key} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-primary-foreground">Kurumsal</h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {hasCategories && (
            <div>
              <h3 className="font-serif text-lg font-semibold text-primary-foreground">Kategoriler</h3>
              <ul className="mt-4 space-y-2.5">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/urunler?category=${encodeURIComponent(cat.name)}`}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-serif text-lg font-semibold text-primary-foreground">Hukuki</h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-accent">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            {!hasCategories && isCategoriesLoading && (
              <p className="mt-4 text-xs text-primary-foreground/45">Kategoriler yükleniyor...</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">© 2026 Can Antika</p>
          <p className="text-sm text-primary-foreground/50">
            Dijital altyapı ve geliştirme:{" "}
            <a
              href="https://fogistanbul.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-primary-foreground/30 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Fogistanbul.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
