import { memo } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTR } from "@/lib/utils"
import type { ActivityLogResponse } from "@/lib/types"

interface ActivityLogTimelineProps {
    activityLogs: ActivityLogResponse[]
}

export default memo(function ActivityLogTimeline({ activityLogs }: ActivityLogTimelineProps) {
    return (
        <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Günlük Log Kayıtları</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
                <div className="relative border-l border-muted ml-3 space-y-6">
                    {activityLogs.length > 0 ? activityLogs.map((log, i) => {
                        let timeStr = ""
                        if (log.createdAt) {
                            try {
                                timeStr = formatDateTR(log.createdAt, "time")
                            } catch { /* malformed date */ }
                        }
                        return (
                            <div key={i} className="pl-6 relative">
                                <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full flex items-center justify-center border-4 border-background text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30">
                                    <RefreshCw className="h-2.5 w-2.5" />
                                </div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Kullanıcı #{log.userId}</p>
                                        <p className="text-[11px] font-medium text-amber-500 mt-0.5">{log.type}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {timeStr}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">{log.description}</p>
                            </div>
                        )
                    }) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">Henüz etkinlik kaydı yok.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
})
