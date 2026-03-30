"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { categoryApi } from "@/lib/api"
import { useSiteSettings } from "@/lib/site-settings-context"
import { cn, sanitizeExternalUrl } from "@/lib/utils"
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

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-primary-foreground/10 py-4 sm:border-none sm:py-0">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex w-full items-center justify-between sm:cursor-auto sm:pointer-events-none"
      >
        <h3 className="font-serif text-lg font-semibold text-primary-foreground">{title}</h3>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-primary-foreground/70 transition-transform duration-300 sm:hidden", 
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out sm:grid-rows-[1fr] sm:mt-4 sm:opacity-100",
          isOpen ? "grid-rows-[1fr] mt-4 opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const settings = useSiteSettings()
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

  useEffect(() => {
    categoryApi
      .getAllCached()
      .then((items) => setCategories(items.slice(0, 6)))
      .catch(() => setCategories([]))
      .finally(() => setIsCategoriesLoading(false))
  }, [])

  const socialLinks = useMemo(
    () => [
      { key: "facebook" as const, href: sanitizeExternalUrl(settings.facebook) },
      { key: "instagram" as const, href: sanitizeExternalUrl(settings.instagram) },
      { key: "twitter" as const, href: sanitizeExternalUrl(settings.twitter) },
      { key: "youtube" as const, href: sanitizeExternalUrl(settings.youtube) },
      { key: "tiktok" as const, href: sanitizeExternalUrl(settings.tiktok) },
    ].filter((item): item is { key: "facebook" | "instagram" | "twitter" | "youtube" | "tiktok"; href: string } => Boolean(item.href)),
    [settings.facebook, settings.instagram, settings.twitter, settings.youtube, settings.tiktok]
  )

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, "")}` : ""
  const mailHref = settings.email ? `mailto:${settings.email}` : ""
  const mapHref = "https://maps.app.goo.gl/Sv4bqXDK7164WQGR9"
  const hasCategories = categories.length > 0

  return (
    <footer className={cn("relative mt-auto overflow-hidden border-t-2 border-[#d4af37]/20 bg-[#5A3A22] text-[#fbf9f6]", className)}>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div
          className={`grid gap-2 sm:gap-10 border-b border-primary-foreground/10 pb-8 sm:pb-10 md:grid-cols-2 xl:gap-8 ${hasCategories ? "xl:grid-cols-4" : "xl:grid-cols-3"
            }`}
        >
          {/* Always Visible Company Info */}
          <div className="mb-6 sm:mb-0">
            <Link href="/" className="inline-block">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-primary-foreground">{settings.storeName || "Can Antika"}</h2>
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-px w-8 bg-gradient-to-r from-[#d4af37]/60 to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#d4af37]">{settings.businessType || "Antika Eşya Satışı"}</span>
              <span className="h-px w-8 bg-gradient-to-l from-[#d4af37]/60 to-transparent" />
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/75">
              {settings.storeDescription || settings.footerAbout || "Nadir parçaları güvenli alışveriş deneyimiyle koleksiyonerlerle buluşturuyoruz."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-primary-foreground/75">
              {settings.phone ? (
                <a href={phoneHref} className="block transition-colors hover:text-[#d4af37]">
                  {settings.phone}
                </a>
              ) : null}
              {settings.email ? (
                <a href={mailHref} className="block transition-colors hover:text-[#d4af37]">
                  {settings.email}
                </a>
              ) : null}
              {settings.address ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block max-w-md transition-colors hover:text-[#d4af37]"
                >
                  {settings.address}
                </a>
              ) : null}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/70 transition-colors hover:border-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
                  >
                    <SocialIcon type={social.key} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Accordion Links on Mobile */}
          <FooterAccordion title="Kurumsal">
            <ul className="space-y-2.5 pb-2 sm:pb-0">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-[#d4af37]">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterAccordion>

          {hasCategories && (
            <FooterAccordion title="Kategoriler">
              <ul className="space-y-2.5 pb-2 sm:pb-0">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/urunler?category=${encodeURIComponent(cat.name)}`}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-[#d4af37]"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterAccordion>
          )}

          <FooterAccordion title="Hukuki">
            <div className="pb-2 sm:pb-0">
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-primary-foreground/70 transition-colors hover:text-[#d4af37]">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {!hasCategories && isCategoriesLoading && (
                <p className="mt-4 text-xs text-primary-foreground/45">Kategoriler yükleniyor...</p>
              )}
            </div>
          </FooterAccordion>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <p className="text-sm text-primary-foreground/60 text-center">© 2026 Can Antika</p>
          <p className="text-sm text-primary-foreground/50 text-center">
            Dijital altyapı ve geliştirme:{" "}
            <a
              href="https://fogistanbul.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-primary-foreground/30 underline-offset-4 transition-colors hover:text-[#d4af37] hover:decoration-[#d4af37]"
            >
              Fogistanbul.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
