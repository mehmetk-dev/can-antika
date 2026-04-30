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
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        ring: "ring-amber-200/50 dark:ring-amber-800/30",
    },
    {
        key: "lowStock",
        href: "/admin/urunler",
        label: "Düşük Stoklu Ürünler",
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30",
        ring: "ring-red-200/50 dark:ring-red-800/30",
    },
    {
        key: "contact",
        href: "/admin/iletisim-talepleri",
        label: "Yeni İletişim Talepleri",
        icon: MessageSquare,
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        ring: "ring-sky-200/50 dark:ring-sky-800/30",
    },
    {
        key: "bankTransfer",
        href: "/admin/havale",
        label: "Havale Onayı Bekleyenler",
        icon: HandCoins,
        color: "text-stone-600 dark:text-stone-400",
        bg: "bg-stone-100 dark:bg-stone-800/50",
        ring: "ring-stone-200/50 dark:ring-stone-700/30",
    },
    {
        key: "returns",
        href: "/admin/iadeler",
        label: "Bekleyen İade Talepleri",
        icon: RotateCcw,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        ring: "ring-rose-200/50 dark:ring-rose-800/30",
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
        <Card className="shadow-sm border-stone-200/60 dark:border-stone-800 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight">Bekleyen İşler</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {taskItems.map((item) => {
                        const count = getCount(item.key, stats, pendingTasks)
                        const hasItems = count > 0
                        return (
                            <Link
                                key={item.key}
                                prefetch={false}
                                href={item.href}
                                className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:ring-1 ${item.ring} hover:shadow-sm ${
                                    hasItems ? "bg-white dark:bg-stone-900/50" : "bg-stone-50/50 dark:bg-stone-900/20"
                                }`}
                            >
                                <div className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                                    <item.icon className={`h-4 w-4 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-muted-foreground truncate">{item.label}</p>
                                    <p className={`text-lg font-bold tabular-nums leading-tight ${
                                        hasItems ? item.color : "text-stone-300 dark:text-stone-600"
                                    }`}>
                                        {count}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors shrink-0" />
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
