import Link from "next/link"
import { Clock, AlertTriangle, MessageSquare, HandCoins, RotateCcw, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatsResponse } from "@/lib/types"

interface PendingTasksGridProps {
    stats: StatsResponse | null
    pendingTasks: { contactRequests: number; bankTransfers: number; pendingReturns: number }
}

const taskItems = [
    {
        key: "pending",
        href: "/admin/siparisler",
        label: "Bekleyen Siparişler",
        icon: Clock,
        iconColor: "text-amber-700",
        iconBg: "bg-amber-100",
        countColor: "text-amber-700",
    },
    {
        key: "lowStock",
        href: "/admin/urunler",
        label: "Düşük Stoklu Ürünler",
        icon: AlertTriangle,
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
        countColor: "text-red-700",
    },
    {
        key: "contact",
        href: "/admin/iletisim-talepleri",
        label: "Yeni İletişim Talepleri",
        icon: MessageSquare,
        iconColor: "text-sky-600",
        iconBg: "bg-sky-100",
        countColor: "text-sky-700",
    },
    {
        key: "bankTransfer",
        href: "/admin/havale",
        label: "Havale Onayı Bekleyenler",
        icon: HandCoins,
        iconColor: "text-stone-600",
        iconBg: "bg-stone-200",
        countColor: "text-stone-700",
    },
    {
        key: "returns",
        href: "/admin/iadeler",
        label: "Bekleyen İade Talepleri",
        icon: RotateCcw,
        iconColor: "text-rose-600",
        iconBg: "bg-rose-100",
        countColor: "text-rose-700",
    },
] as const

function getCount(key: string, stats: StatsResponse | null, pendingTasks: PendingTasksGridProps["pendingTasks"]): number {
    switch (key) {
        case "pending": return stats?.pendingOrders || 0
        case "lowStock": return stats?.lowStockProducts || 0
        case "contact": return pendingTasks.contactRequests
        case "bankTransfer": return pendingTasks.bankTransfers
        case "returns": return pendingTasks.pendingReturns
        default: return 0
    }
}

export default function PendingTasksGrid({ stats, pendingTasks }: PendingTasksGridProps) {
    return (
        <Card className="shadow-sm border-stone-200 overflow-hidden bg-white">
            <CardHeader className="py-3 px-5 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-amber-100 flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-amber-700" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">Bekleyen İşler</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {taskItems.map((item) => {
                        const count = getCount(item.key, stats, pendingTasks)
                        const hasItems = count > 0
                        return (
                            <Link
                                key={item.key}
                                prefetch={false}
                                href={item.href}
                                className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                                    hasItems
                                        ? "bg-white border-stone-200 hover:border-amber-300 hover:bg-amber-50/30"
                                        : "bg-stone-50/50 border-stone-100"
                                }`}
                            >
                                <div className={`h-9 w-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-stone-600 truncate font-medium">{item.label}</p>
                                    <p className={`text-lg font-bold tabular-nums leading-tight ${
                                        hasItems ? item.countColor : "text-stone-300"
                                    }`}>
                                        {count}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
