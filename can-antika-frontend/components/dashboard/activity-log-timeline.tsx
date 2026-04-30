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
        <Card className="shadow-sm border-stone-200 dark:border-stone-700 overflow-hidden bg-white dark:bg-stone-900">
            <CardHeader className="py-3 px-5 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                        <Activity className="h-3.5 w-3.5 text-stone-600 dark:text-stone-300" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">Aktivite Akışı</CardTitle>
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
                                        <div className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-[3px] border-white dark:border-stone-900 ${dotColor} ring-2 ring-stone-100 dark:ring-stone-800`} />

                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <User className="h-3 w-3 text-stone-500 dark:text-stone-400 shrink-0" />
                                                    <span className="text-[12px] font-semibold text-stone-900 dark:text-stone-100">
                                                        Kullanıcı #{log.userId}
                                                    </span>
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                                        {log.type}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                                                    {log.description}
                                                </p>
                                            </div>
                                            {timeStr && (
                                                <span className="text-[10px] text-stone-500 dark:text-stone-400 whitespace-nowrap tabular-nums shrink-0 mt-0.5 font-medium">
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
                    <div className="text-center py-8 text-sm text-stone-500 dark:text-stone-400">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Henüz aktivite kaydı yok.
                    </div>
                )}
            </CardContent>
        </Card>
    )
})
