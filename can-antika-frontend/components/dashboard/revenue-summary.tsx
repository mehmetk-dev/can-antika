import { Card, CardContent } from "@/components/ui/card"
import { formatDateTR } from "@/lib/utils"
import type { StatsResponse } from "@/lib/types"

interface RevenueSummaryProps {
    stats: StatsResponse | null
}

export default function RevenueSummary({ stats }: RevenueSummaryProps) {
    const today = new Date()

    return (
        <Card className="shadow-xs border-border/50">
            <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Günlük Ciro</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTR(today, "full")}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-500">
                        {stats?.dailyStats?.[stats.dailyStats.length - 1]?.revenue
                            ? `₺${stats.dailyStats[stats.dailyStats.length - 1].revenue.toLocaleString("tr-TR")}`
                            : "0,00 TL"}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Aylık Ciro</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTR(today, "month-year")}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-500">
                        {stats?.monthlyTrends?.[stats.monthlyTrends.length - 1]?.revenue
                            ? `₺${stats.monthlyTrends[stats.monthlyTrends.length - 1].revenue.toLocaleString("tr-TR")}`
                            : "0,00 TL"}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Yıllık Ciro</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{today.getFullYear()}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-500">
                        {stats?.totalRevenue ? `₺${stats.totalRevenue.toLocaleString("tr-TR")}` : "0,00 TL"}
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-950/10">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Geçen Ay</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Önceki Ayın Cirosu</p>
                    </div>
                    <p className="text-sm font-bold text-rose-500">
                        {stats?.monthlyTrends?.length && stats.monthlyTrends.length > 1
                            ? `₺${stats.monthlyTrends[stats.monthlyTrends.length - 2].revenue.toLocaleString("tr-TR")}`
                            : "0,00 TL"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
