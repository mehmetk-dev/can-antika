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
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        countColor: "text-amber-700 dark:text-amber-300",
    },
    {
        key: "lowStock",
        href: "/admin/urunler",
        label: "Düşük Stoklu Ürünler",
        icon: AlertTriangle,
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-100 dark:bg-red-900/40",
        countColor: "text-red-700 dark:text-red-300",
    },
    {
        key: "contact",
        href: "/admin/iletisim-talepleri",
        label: "Yeni İletişim Talepleri",
        icon: MessageSquare,
        iconColor: "text-sky-600 dark:text-sky-400",
        iconBg: "bg-sky-100 dark:bg-sky-900/40",
        countColor: "text-sky-700 dark:text-sky-300",
    },
    {
        key: "bankTransfer",
        href: "/admin/havale",
        label: "Havale Onayı Bekleyenler",
        icon: HandCoins,
        iconColor: "text-stone-600 dark:text-stone-300",
        iconBg: "bg-stone-200 dark:bg-stone-700",
        countColor: "text-stone-700 dark:text-stone-200",
    },
    {
        key: "returns",
        href: "/admin/iadeler",
        label: "Bekleyen İade Talepleri",
        icon: RotateCcw,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        countColor: "text-rose-700 dark:text-rose-300",
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
        <Card className="shadow-sm border-stone-200 dark:border-stone-700 overflow-hidden bg-white dark:bg-stone-900">
            <CardHeader className="py-3 px-5 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">Bekleyen İşler</CardTitle>
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
                                        ? "bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                                        : "bg-stone-50 dark:bg-stone-800/20 border-stone-100 dark:border-stone-800"
                                }`}
                            >
                                <div className={`h-9 w-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] text-stone-600 dark:text-stone-300 truncate font-medium">{item.label}</p>
                                    <p className={`text-lg font-bold tabular-nums leading-tight ${
                                        hasItems ? item.countColor : "text-stone-400 dark:text-stone-500"
                                    }`}>
                                        {count}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors shrink-0" />
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
