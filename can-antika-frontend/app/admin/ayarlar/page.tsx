"use client"

import { useState, useEffect } from "react"
import {
  Save, Store, Building, Phone, Truck, Share2, Search,
  FileText, AlertTriangle, Mail, MessageSquare, CreditCard,
  Coins, Loader2, Settings2, Wallet, Palette, Server
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"
import type { SiteSettingsResponse } from "@/lib/types"
import { siteSettingsApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { TAB_COMPONENTS } from "@/components/admin/settings"

/* ───────────────────────── Tipleri & Sabitler ───────────────────────── */

interface TabItem {
  key: string
  label: string
  icon: React.ElementType
  description: string
}

interface SettingsGroup {
  id: string
  title: string
  icon: React.ElementType
  tabs: TabItem[]
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: "general",
    title: "Genel Ayarlar",
    icon: Settings2,
    tabs: [
      { key: "store", label: "Mağaza Bilgileri", icon: Store, description: "Mağazanızın temel kimlik bilgilerini düzenleyin" },
      { key: "company", label: "Firma Bilgileri", icon: Building, description: "Fatura ve yasal bilgilerinizi yönetin" },
      { key: "contact", label: "İletişim", icon: Phone, description: "İletişim ve çalışma saati bilgilerini güncelleyin" },
    ],
  },
  {
    id: "operations",
    title: "Operasyon & Finans",
    icon: Wallet,
    tabs: [
      { key: "shipping", label: "Teslimat", icon: Truck, description: "Kargo ve teslimat seçeneklerini yapılandırın" },
      { key: "payment", label: "Ödeme Ayarları", icon: CreditCard, description: "Ödeme yöntemlerini ve sanal POS'u yönetin" },
      { key: "currency", label: "Para Birimi", icon: Coins, description: "Para birimi ve sembol ayarları" },
    ],
  },
  {
    id: "appearance",
    title: "Görünüm & Pazarlama",
    icon: Palette,
    tabs: [
      { key: "footer", label: "Footer", icon: FileText, description: "Site alt kısmı metin ve telif bilgileri" },
      { key: "social", label: "Sosyal Medya", icon: Share2, description: "Sosyal medya hesap bağlantılarınız" },
      { key: "seo", label: "SEO & Takip", icon: Search, description: "Arama motoru ve analytics ayarları" },
    ],
  },
  {
    id: "system",
    title: "Sistem & Entegrasyonlar",
    icon: Server,
    tabs: [
      { key: "smtp", label: "E-posta (SMTP)", icon: Mail, description: "SMTP sunucu ile e-posta gönderim yapılandırması" },
      { key: "sms", label: "SMS Ayarları", icon: MessageSquare, description: "SMS sağlayıcı ve bildirim ayarları" },
      { key: "maintenance", label: "Bakım Modu", icon: AlertTriangle, description: "Site erişimini geçici olarak kapatın" },
    ],
  },
]

const ALL_TABS = SETTINGS_GROUPS.flatMap((g) => g.tabs)

/* ───────────────────────── Ana Bileşen ───────────────────────── */

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maintenanceSaving, setMaintenanceSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("store")

  useEffect(() => {
    siteSettingsApi
      .getAdmin()
      .then((data) => setSettings(data))
      .catch(() => toast.error("Ayarlar yüklenemedi"))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleChange = (key: string, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleMaintenanceModeChange = async (nextMode: boolean) => {
    if (!settings) return

    const prev = settings
    const optimistic = { ...settings, maintenanceMode: nextMode }
    setSettings(optimistic)
    setMaintenanceSaving(true)

    try {
      const updated = await siteSettingsApi.update(optimistic)
      setSettings(updated)
      toast.success(nextMode ? "Bakım modu aktif edildi" : "Bakım modu kapatıldı")
    } catch {
      setSettings(prev)
      toast.error("Bakım modu güncellenemedi")
    } finally {
      setMaintenanceSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await siteSettingsApi.update(settings)
      setSettings(updated)
      toast.success("Ayarlar kaydedildi")
    } catch {
      toast.error("Kaydetme başarısız")
    } finally {
      setSaving(false)
    }
  }

  const activeTabInfo = ALL_TABS.find((t) => t.key === activeTab)!

  return (
    <div className="space-y-0">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Ayarlar</h1>
            <p className="text-muted-foreground">Site ayarlarını yönetin</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </Button>
        </div>
      </div>

      {/* ── İçerik: Sol Menü + Sağ Panel ── */}
      <div className="flex gap-6">
        {/* Sol Menü — Accordion */}
        <nav className="w-60 shrink-0" aria-label="Ayarlar navigasyonu">
          <Accordion
            type="multiple"
            defaultValue={SETTINGS_GROUPS.map((g) => g.id)}
            className="space-y-1"
          >
            {SETTINGS_GROUPS.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="border-none"
              >
                <AccordionTrigger
                  className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline hover:text-foreground rounded-md [&[data-state=open]>svg]:rotate-180"
                >
                  <span className="flex items-center gap-2">
                    <group.icon className="h-3.5 w-3.5" />
                    {group.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-0">
                  <div className="space-y-0.5 pl-1">
                    {group.tabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 text-left",
                          activeTab === tab.key
                            ? "bg-[#14452F] text-white shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <tab.icon className={cn("h-4 w-4 shrink-0", activeTab === tab.key ? "text-emerald-300" : "")} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        {/* Sağ İçerik — Card */}
        <div className="flex-1 min-w-0">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif flex items-center gap-2.5 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14452F]/10">
                  <activeTabInfo.icon className="h-4 w-4 text-[#14452F]" />
                </div>
                {activeTabInfo.label}
              </CardTitle>
              <CardDescription>{activeTabInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const TabComponent = TAB_COMPONENTS[activeTab]
                return TabComponent ? (
                  <TabComponent
                    settings={settings}
                    onChange={handleChange}
                    onMaintenanceModeChange={handleMaintenanceModeChange}
                    maintenanceSaving={maintenanceSaving}
                  />
                ) : null
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

