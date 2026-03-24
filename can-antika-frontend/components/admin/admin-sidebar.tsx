"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, FolderOpen, Tag,
  ShoppingCart, RotateCcw, CreditCard, ShoppingBasket,
  Users, MessageSquare, Inbox, Star, Ticket,
  PenTool, FileText, HelpCircle, Monitor, Mail, Clock3,
  Bell, Settings, LogOut, Store, ChevronRight, UserCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const DASHBOARD_LINK: NavItem = {
  name: "Dashboard",
  href: "/admin",
  icon: LayoutDashboard,
}

const GROUPS: NavGroup[] = [
  {
    label: "Katalog Yönetimi",
    icon: Package,
    items: [
      { name: "Ürünler", href: "/admin/urunler", icon: Package },
      { name: "Kategoriler", href: "/admin/kategoriler", icon: FolderOpen },
      { name: "Dönemler", href: "/admin/donemler", icon: Clock3 },
      { name: "Markalar", href: "/admin/markalar", icon: Tag },
    ],
  },
  {
    label: "Siparişler & Satış",
    icon: ShoppingCart,
    items: [
      { name: "Tüm Siparişler", href: "/admin/siparisler", icon: ShoppingCart },
      { name: "İadeler", href: "/admin/iadeler", icon: RotateCcw },
      { name: "Havale/EFT Bildirimleri", href: "/admin/havale", icon: CreditCard },
      { name: "Sepet Takibi", href: "/admin/terk-edilen-sepetler", icon: ShoppingBasket },
    ],
  },
  {
    label: "Müşteriler & Pazarlama",
    icon: Users,
    items: [
      { name: "Müşteri Listesi", href: "/admin/musteriler", icon: Users },
      { name: "Müşteri Soruları", href: "/admin/sorgular", icon: MessageSquare },
      { name: "İletişim Talepleri", href: "/admin/iletisim-talepleri", icon: Inbox },
      { name: "Yorumlar", href: "/admin/yorumlar", icon: Star },
      { name: "Kuponlar", href: "/admin/kuponlar", icon: Ticket },
    ],
  },
  {
    label: "İçerik (CMS)",
    icon: FileText,
    items: [
      { name: "Blog", href: "/admin/blog", icon: PenTool },
      { name: "Sayfalar", href: "/admin/sayfalar", icon: FileText },
      { name: "SSS", href: "/admin/sss", icon: HelpCircle },
      { name: "Popup", href: "/admin/popup", icon: Monitor },
      { name: "Bülten", href: "/admin/bulten", icon: Mail },
    ],
  },
  {
    label: "Sistem",
    icon: Settings,
    items: [
      { name: "Bildirimler", href: "/admin/bildirimler", icon: Bell },
      { name: "Ayarlar", href: "/admin/ayarlar", icon: Settings },
    ],
  },
]

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0a2614] text-[#e8e6e3] border-r border-[#14452F]", className)}>
      <div className="flex h-16 items-center gap-3 border-b border-[#1a3d24] px-6 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14452F] text-[#4ade80]">
          <Store className="h-4 w-4" />
        </div>
        <span className="font-serif text-xl font-semibold text-white tracking-wide">Can Antika</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-thumb-[#1a3d24] scrollbar-track-transparent">
        <div className="space-y-1.5">
          <Link
            prefetch={false}
            href={DASHBOARD_LINK.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200 border-l-2",
              pathname === DASHBOARD_LINK.href
                ? "bg-[#14452F] text-white border-[#4ade80] shadow-sm shadow-[#05140a]"
                : "text-[#b4c4ba] hover:bg-[#11331c] hover:text-white border-transparent"
            )}
          >
            <DASHBOARD_LINK.icon className="h-4 w-4 shrink-0" />
            {DASHBOARD_LINK.name}
          </Link>

          <div className="my-4 mx-2 border-t border-[#1a3d24]" />

          <div className="space-y-1.5">
            {GROUPS.map((group) => (
              <SidebarGroup key={group.label} group={group} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-[#1a3d24] bg-[#0a2614] p-4 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <UserCircle className="h-9 w-9 text-[#4ade80]" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white line-clamp-1">Admin Kullanıcısı</span>
            <span className="text-xs text-[#8a9e91]">Sistem Yöneticisi</span>
          </div>
        </div>
        <Link href="/">
          <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#14452F] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#1a553a] hover:shadow-md active:scale-[0.98]">
            <LogOut className="h-4 w-4" />
            Mağazaya Dön
          </button>
        </Link>
      </div>
    </aside>
  )
}

interface SidebarGroupProps {
  group: NavGroup
  pathname: string
}

function SidebarGroup({ group, pathname }: SidebarGroupProps) {
  const hasActiveItem = group.items.some(
    (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
  )

  return (
    <Collapsible defaultOpen={hasActiveItem}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-[#11331c] data-[state=open]:bg-[#0d2e1a]">
        <group.icon className="h-4 w-4 text-[#8a9e91] group-hover:text-white group-data-[state=open]:text-[#4ade80] transition-colors" />
        <span className="flex-1 text-[14px] font-medium text-[#b4c4ba] group-hover:text-white group-data-[state=open]:text-white transition-colors text-left">
          {group.label}
        </span>
        <ChevronRight className="h-4 w-4 text-[#607a68] transition-transform duration-200 group-data-[state=open]:rotate-90 group-data-[state=open]:text-[#8a9e91]" />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="mx-3 mt-1.5 space-y-1 border-l border-[#1a3d24] pl-2 py-1">
          {group.items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                prefetch={false}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200 relative",
                  isActive
                    ? "text-white bg-[#14452F]"
                    : "text-[#8a9e91] hover:text-white hover:bg-[#11331c]"
                )}
              >
                {isActive && (
                  <span className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#4ade80] rounded-r-md" />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#4ade80]" : "")} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
