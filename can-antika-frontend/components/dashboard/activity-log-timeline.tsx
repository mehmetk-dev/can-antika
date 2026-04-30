import { memo } from "react"
import { Activity, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTR } from "@/lib/utils"
import type { ActivityLogResponse } from "@/lib/types"

interface ActivityLogTimelineProps {
    activityLogs: ActivityLogResponse[]
}

const activityColors: Record<string, string> = {
    ORDER: "bg-emerald-500",
    PAYMENT: "bg-amber-500",
    RETURN: "bg-rose-500",
    USER: "bg-sky-500",
    PRODUCT: "bg-stone-500",
}

function getActivityDotColor(type: string): string {
    return activityColors[type] || "bg-stone-400"
}

export default memo(function ActivityLogTimeline({ activityLogs }: ActivityLogTimelineProps) {
    return (
        <Card className="shadow-sm border-stone-200/60 dark:border-stone-800 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                        <Activity className="h-3.5 w-3.5 text-stone-600 dark:text-stone-300" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight">Aktivite Akışı</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {activityLogs.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200 dark:bg-stone-700" />

                        <div className="space-y-5">
                            {activityLogs.map((log, i) => {
                                let timeStr = ""
                                if (log.createdAt) {
                                    try { timeStr = formatDateTR(log.createdAt, "time") } catch { /* */ }
                                }
                                const dotColor = getActivityDotColor(log.type)

                                return (
                                    <div key={i} className="relative pl-7 group">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-background ${dotColor} ring-2 ring-background`} />

                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span className="text-[12px] font-semibold text-foreground">
                                                        Kullanıcı #{log.userId}
                                                    </span>
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                                                        {log.type}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    {log.description}
                                                </p>
                                            </div>
                                            {timeStr && (
                                                <span className="text-[10px] text-stone-400 dark:text-stone-500 whitespace-nowrap tabular-nums shrink-0 mt-0.5">
                                                    {timeStr}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-stone-400 dark:text-stone-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Henüz aktivite kaydı yok.
                    </div>
                )}
            </CardContent>
        </Card>
    )
})
