"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTR } from "@/lib/utils"
import type { StatsResponse } from "@/lib/types"

interface RevenueSummaryProps {
    stats: StatsResponse | null
}

function formatCurrency(value: number): string {
    return value > 0 ? `₺${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "₺0"
}

export default function RevenueSummary({ stats }: RevenueSummaryProps) {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const todayRevenue = useMemo(() => {
        if (!stats?.dailyStats?.length) return 0
        const todayEntry = stats.dailyStats.find(d => d.date === todayStr)
        return todayEntry?.revenue ?? 0
    }, [stats?.dailyStats, todayStr])

    const currentMonthRevenue = useMemo(() => {
        if (!stats?.monthlyTrends?.length) return 0
        const currentMonth = todayStr.substring(0, 7)
        const entry = stats.monthlyTrends.find(m => m.month === currentMonth)
        return entry?.revenue ?? 0
    }, [stats?.monthlyTrends, todayStr])

    const previousMonthRevenue = useMemo(() => {
        if (!stats?.monthlyTrends?.length || stats.monthlyTrends.length < 2) return 0
        const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
        const entry = stats.monthlyTrends.find(m => m.month === prevMonthStr)
        return entry?.revenue ?? 0
    }, [stats?.monthlyTrends, today])

    const monthOverMonth = currentMonthRevenue > 0 && previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100)
        : null

    const rows = [
        {
            label: "Günlük Ciro",
            sub: formatDateTR(today, "full"),
            value: todayRevenue,
            icon: DollarSign,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-700",
        },
        {
            label: "Aylık Ciro",
            sub: formatDateTR(today, "month-year"),
            value: currentMonthRevenue,
            icon: Calendar,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-700",
        },
        {
            label: "Yıllık Ciro",
            sub: String(today.getFullYear()),
            value: stats?.totalRevenue ? Number(stats.totalRevenue) : 0,
            icon: TrendingUp,
            iconBg: "bg-sky-100",
            iconColor: "text-sky-700",
        },
    ]

    return (
        <Card className="shadow-sm border-stone-200 overflow-hidden bg-white">
            <CardHeader className="py-3 px-5 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-700" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">Ciro Özeti</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className={`flex items-center justify-between px-5 py-3.5 ${
                            i < rows.length - 1 ? "border-b border-stone-100" : ""
                        } transition-colors duration-200 hover:bg-stone-50/50`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${row.iconBg} flex items-center justify-center`}>
                                <row.icon className={`h-4 w-4 ${row.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-stone-700">{row.label}</p>
                                <p className="text-[11px] text-stone-400 mt-0.5">{row.sub}</p>
                            </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-stone-800">
                            {formatCurrency(row.value)}
                        </p>
                    </div>
                ))}

                {/* Geçen Ay Karşılaştırma */}
                <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-stone-200 flex items-center justify-center">
                                {monthOverMonth !== null && monthOverMonth >= 0
                                    ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    : <TrendingDown className="h-4 w-4 text-red-600" />
                                }
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-stone-700">Geçen Ay</p>
                                <p className="text-[11px] text-stone-400 mt-0.5">Önceki Ayın Cirosu</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold tabular-nums text-stone-800">
                                {formatCurrency(previousMonthRevenue)}
                            </p>
                            {monthOverMonth !== null && (
                                <p className={`text-[11px] font-semibold mt-0.5 ${
                                    monthOverMonth >= 0 ? "text-emerald-600" : "text-red-600"
                                }`}>
                                    {monthOverMonth >= 0 ? "+" : ""}{monthOverMonth.toFixed(1)}%
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
