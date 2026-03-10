"use client"

import { useState, useEffect } from "react"
import {
  Save, Store, Building, Phone, Truck, Share2, Search,
  FileText, AlertTriangle, Mail, MessageSquare, CreditCard,
  Coins, Loader2, Settings2, Wallet, Palette, Server
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"
import type { SiteSettingsResponse } from "@/lib/types"
import { siteSettingsApi } from "@/lib/api"
import { cn } from "@/lib/utils"

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
              {/* ── MAĞAZA BİLGİLERİ ── */}
              {activeTab === "store" && (
                <div className="space-y-4">
                  <Field label="Mağaza Adı" value={settings.storeName} onChange={(v) => handleChange("storeName", v)} />
                  <Field label="İş Türü" value={settings.businessType} onChange={(v) => handleChange("businessType", v)} placeholder="Antika, Koleksiyon..." />
                  <TextareaField label="Mağaza Açıklaması" value={settings.storeDescription} onChange={(v) => handleChange("storeDescription", v)} rows={3} />
                </div>
              )}

              {/* ── FİRMA BİLGİLERİ ── */}
              {activeTab === "company" && (
                <div className="space-y-4">
                  <Field label="Firma Adı" value={settings.companyName} onChange={(v) => handleChange("companyName", v)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Vergi No" value={settings.taxId} onChange={(v) => handleChange("taxId", v)} />
                    <Field label="Vergi Dairesi" value={settings.taxOffice} onChange={(v) => handleChange("taxOffice", v)} />
                  </div>
                </div>
              )}

              {/* ── İLETİŞİM ── */}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Telefon" value={settings.phone} onChange={(v) => handleChange("phone", v)} />
                    <Field label="E-posta" value={settings.email} onChange={(v) => handleChange("email", v)} />
                    <Field label="WhatsApp" value={settings.whatsapp} onChange={(v) => handleChange("whatsapp", v)} />
                    <Field label="Web Sitesi" value={settings.website} onChange={(v) => handleChange("website", v)} disabled hint="Web sitesi adresi sistem tarafından yönetilir" />
                  </div>
                  <TextareaField label="Adres" value={settings.address} onChange={(v) => handleChange("address", v)} rows={2} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Hafta İçi Çalışma Saatleri" value={settings.weekdayHours} onChange={(v) => handleChange("weekdayHours", v)} placeholder="09:00 - 18:00" />
                    <Field label="Cumartesi Çalışma Saatleri" value={settings.saturdayHours} onChange={(v) => handleChange("saturdayHours", v)} placeholder="10:00 - 14:00" />
                  </div>
                </div>
              )}

              {/* ── TESLİMAT ── */}
              {activeTab === "shipping" && (
                <div className="space-y-4">
                  <Field label="Standart Teslimat Açıklaması" value={settings.standardDelivery} onChange={(v) => handleChange("standardDelivery", v)} placeholder="Örn: 3-5 iş günü" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ücretsiz Kargo Alt Limiti (₺)" value={settings.freeShippingMin} onChange={(v) => handleChange("freeShippingMin", Number(v))} type="number" />
                    <Field label="Kargo Süresi (Gün)" value={settings.shippingDurationDays} onChange={(v) => handleChange("shippingDurationDays", Number(v))} type="number" />
                  </div>
                </div>
              )}

              {/* ── ÖDEME AYARLARI ── */}
              {activeTab === "payment" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Ödeme Yöntemleri</h3>
                    <div className="space-y-2">
                      <Toggle label="Kredi Kartı" checked={settings.creditCardEnabled} onChange={(v) => handleChange("creditCardEnabled", v)} desc="Sanal POS ile online ödeme" />
                      <Toggle label="Havale / EFT" checked={settings.bankTransferEnabled} onChange={(v) => handleChange("bankTransferEnabled", v)} desc="Banka havalesi ile ödeme" />
                      <Toggle label="Kapıda Ödeme" checked={settings.cashOnDeliveryEnabled} onChange={(v) => handleChange("cashOnDeliveryEnabled", v)} desc="Teslimat anı nakit veya kart" />
                    </div>
                  </div>

                  <hr className="border-border/50" />

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Sanal POS Ayarları</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Ödeme Sağlayıcı</label>
                        <select
                          className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                          value={settings.paymentProvider ?? ""}
                          onChange={(e) => handleChange("paymentProvider", e.target.value)}
                        >
                          <option value="">Seçin</option>
                          <option value="iyzico">iyzico</option>
                          <option value="paytr">PayTR</option>
                          <option value="param">Param</option>
                          <option value="stripe">Stripe</option>
                        </select>
                      </div>
                      <Field label="Merchant ID" value={settings.paymentMerchantId} onChange={(v) => handleChange("paymentMerchantId", v)} />
                      <Field label="API Key" value={settings.paymentApiKey} onChange={(v) => handleChange("paymentApiKey", v)} />
                      <Field label="Secret Key" value={settings.paymentSecretKey} onChange={(v) => handleChange("paymentSecretKey", v)} type="password" />
                    </div>
                  </div>

                  <hr className="border-border/50" />

                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/20">
                    <input
                      type="checkbox"
                      id="testMode"
                      checked={settings.paymentTestMode}
                      onChange={(e) => handleChange("paymentTestMode", e.target.checked)}
                      className="h-5 w-5 accent-[#14452F]"
                    />
                    <div>
                      <label htmlFor="testMode" className="text-sm font-semibold cursor-pointer">
                        Test Modu {settings.paymentTestMode ? "🟡 Aktif (Gerçek ödeme alınmıyor)" : "🟢 Kapalı (Canlı mod)"}
                      </label>
                      <p className="text-xs text-muted-foreground">Canlıya almadan önce test modunu kapatın</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PARA BİRİMİ ── */}
              {activeTab === "currency" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Para Birimi Kodu" value={settings.currency} onChange={(v) => handleChange("currency", v)} placeholder="TRY" />
                    <Field label="Sembol" value={settings.currencySymbol} onChange={(v) => handleChange("currencySymbol", v)} placeholder="₺" />
                  </div>
                </div>
              )}

              {/* ── FOOTER ── */}
              {activeTab === "footer" && (
                <div className="space-y-4">
                  <TextareaField label="Footer Hakkında Metni" value={settings.footerAbout} onChange={(v) => handleChange("footerAbout", v)} rows={3} />
                  <Field label="Copyright Metni" value={settings.footerCopyright} onChange={(v) => handleChange("footerCopyright", v)} />
                </div>
              )}

              {/* ── SOSYAL MEDYA ── */}
              {activeTab === "social" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Facebook" value={settings.facebook} onChange={(v) => handleChange("facebook", v)} placeholder="https://facebook.com/..." />
                    <Field label="Instagram" value={settings.instagram} onChange={(v) => handleChange("instagram", v)} placeholder="https://instagram.com/..." />
                    <Field label="Twitter / X" value={settings.twitter} onChange={(v) => handleChange("twitter", v)} placeholder="https://x.com/..." />
                    <Field label="YouTube" value={settings.youtube} onChange={(v) => handleChange("youtube", v)} placeholder="https://youtube.com/..." />
                    <Field label="TikTok" value={settings.tiktok} onChange={(v) => handleChange("tiktok", v)} placeholder="https://tiktok.com/..." />
                  </div>
                </div>
              )}

              {/* ── SEO & TAKİP ── */}
              {activeTab === "seo" && (
                <div className="space-y-4">
                  <Field label="Meta Başlık (Title)" value={settings.metaTitle} onChange={(v) => handleChange("metaTitle", v)} />
                  <TextareaField label="Meta Açıklama (Description)" value={settings.metaDescription} onChange={(v) => handleChange("metaDescription", v)} rows={2} />
                  <Field label="Anahtar Kelimeler (virgülle ayırın)" value={settings.metaKeywords} onChange={(v) => handleChange("metaKeywords", v)} />
                  <hr className="border-border/50 my-2" />
                  <Field label="Google Analytics ID" value={settings.googleAnalyticsId} onChange={(v) => handleChange("googleAnalyticsId", v)} placeholder="G-XXXXXXXXXX" />
                  <Field label="Facebook Pixel ID" value={settings.facebookPixelId} onChange={(v) => handleChange("facebookPixelId", v)} />
                  <TextareaField label="Özel Head Script'ler" value={settings.customHeadScripts} onChange={(v) => handleChange("customHeadScripts", v)} rows={4} placeholder="<script>...</script>" className="font-mono text-sm" />
                </div>
              )}

              {/* ── E-POSTA (SMTP) ── */}
              {activeTab === "smtp" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="SMTP Host" value={settings.smtpHost} onChange={(v) => handleChange("smtpHost", v)} placeholder="smtp.gmail.com" />
                    <Field label="SMTP Port" value={settings.smtpPort} onChange={(v) => handleChange("smtpPort", Number(v))} type="number" placeholder="587" />
                    <Field label="Kullanıcı Adı" value={settings.smtpUsername} onChange={(v) => handleChange("smtpUsername", v)} />
                    <Field label="Şifre" value={settings.smtpPassword} onChange={(v) => handleChange("smtpPassword", v)} type="password" />
                    <Field label="Gönderen E-posta" value={settings.smtpFromEmail} onChange={(v) => handleChange("smtpFromEmail", v)} placeholder="info@canantika.com" />
                    <Field label="Gönderen Adı" value={settings.smtpFromName} onChange={(v) => handleChange("smtpFromName", v)} placeholder="Can Antika" />
                  </div>
                </div>
              )}

              {/* ── SMS AYARLARI ── */}
              {activeTab === "sms" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                    <input
                      type="checkbox"
                      id="smsEnabled"
                      checked={settings.smsEnabled}
                      onChange={(e) => handleChange("smsEnabled", e.target.checked)}
                      className="h-5 w-5 accent-[#14452F]"
                    />
                    <div>
                      <label htmlFor="smsEnabled" className="text-sm font-semibold cursor-pointer">
                        SMS Gönderimi {settings.smsEnabled ? "🟢 Aktif" : "🔴 Kapalı"}
                      </label>
                      <p className="text-xs text-muted-foreground">Sipariş ve bildirim SMS'leri</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">SMS Sağlayıcı</label>
                      <select
                        className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                        value={settings.smsProvider ?? ""}
                        onChange={(e) => handleChange("smsProvider", e.target.value)}
                      >
                        <option value="">Seçin</option>
                        <option value="netgsm">NetGSM</option>
                        <option value="iletimerkezi">İleti Merkezi</option>
                        <option value="mutlucell">Mutlucell</option>
                      </select>
                    </div>
                    <Field label="Gönderen Adı" value={settings.smsSenderName} onChange={(v) => handleChange("smsSenderName", v)} />
                    <Field label="API Key" value={settings.smsApiKey} onChange={(v) => handleChange("smsApiKey", v)} />
                    <Field label="API Secret" value={settings.smsApiSecret} onChange={(v) => handleChange("smsApiSecret", v)} type="password" />
                  </div>
                </div>
              )}

              {/* ── BAKIM MODU ── */}
              {activeTab === "maintenance" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                      className="h-5 w-5 accent-[#14452F]"
                    />
                    <div>
                      <label htmlFor="maintenanceMode" className="text-sm font-semibold cursor-pointer">
                        Bakım Modu {settings.maintenanceMode ? "🔴 Aktif" : "🟢 Kapalı"}
                      </label>
                      <p className="text-xs text-muted-foreground">Aktifken ziyaretçiler siteye giremez</p>
                    </div>
                  </div>
                  <TextareaField label="Bakım Mesajı" value={settings.maintenanceMessage} onChange={(v) => handleChange("maintenanceMessage", v)} rows={3} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Yardımcı Bileşenler ───────────────────────── */

interface FieldProps {
  label: string
  value: unknown
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  hint?: string
}

function Field({ label, value, onChange, type = "text", placeholder, disabled, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {disabled && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
            Değiştirilemez
          </span>
        )}
      </div>
      <Input
        type={type}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "bg-muted/30 border-border/60 focus-visible:ring-[#14452F]/30",
          disabled && "opacity-60 cursor-not-allowed bg-muted/60"
        )}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface TextareaFieldProps {
  label: string
  value: unknown
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
  className?: string
}

function TextareaField({ label, value, onChange, rows = 3, placeholder, className }: TextareaFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Textarea
        rows={rows}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("bg-muted/30 border-border/60 focus-visible:ring-[#14452F]/30", className)}
      />
    </div>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  desc: string
}

function Toggle({ label, checked, onChange, desc }: ToggleProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#14452F]"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
