import Link from "next/link"
import { Clock, AlertTriangle, MessageSquare, HandCoins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { StatsResponse } from "@/lib/types"

interface PendingTasksGridProps {
    stats: StatsResponse | null
    pendingTasks: { contactRequests: number; bankTransfers: number }
}

export default function PendingTasksGrid({ stats, pendingTasks }: PendingTasksGridProps) {
    return (
        <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Bekleyen İşler</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link prefetch={false} href="/admin/siparisler" className="flex items-center justify-between p-3 border rounded-lg border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 h-8 w-8 rounded-full flex items-center justify-center text-indigo-600"><Clock className="h-4 w-4" /></div>
                            <span className="text-sm text-foreground">Bekleyen Siparişler</span>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                            {stats?.pendingOrders || 0}
                        </Badge>
                    </Link>

                    <Link prefetch={false} href="/admin/urunler" className="flex items-center justify-between p-3 border rounded-lg border-amber-200/70 bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 h-8 w-8 rounded-full flex items-center justify-center text-amber-700"><AlertTriangle className="h-4 w-4" /></div>
                            <span className="text-sm text-foreground">Düşük Stoklu Ürünler</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            {stats?.lowStockProducts || 0}
                        </Badge>
                    </Link>

                    <Link prefetch={false} href="/admin/iletisim-talepleri" className="flex items-center justify-between p-3 border rounded-lg border-blue-100 bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center text-blue-600"><MessageSquare className="h-4 w-4" /></div>
                            <span className="text-sm text-foreground">Yeni İletişim Talepleri</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {pendingTasks.contactRequests}
                        </Badge>
                    </Link>

                    <Link prefetch={false} href="/admin/havale" className="flex items-center justify-between p-3 border rounded-lg border-amber-100 bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 h-8 w-8 rounded-full flex items-center justify-center text-amber-600"><HandCoins className="h-4 w-4" /></div>
                            <span className="text-sm text-foreground">Havale Onayı Bekleyenler</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            {pendingTasks.bankTransfers}
                        </Badge>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}


