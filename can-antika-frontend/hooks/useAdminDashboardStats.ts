"use client"

import { useState, useEffect } from "react"
import { statsApi, orderApi, activityLogApi, contactApi, bankTransferApi } from "@/lib/api"
import type { StatsResponse, OrderResponse, ActivityLogResponse } from "@/lib/types"
import { formatDateTR } from "@/lib/utils"

const RANGE_DAYS: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90, "6M": 180, "1Y": 365 }

export type ChartRange = "7D" | "30D" | "90D" | "6M" | "1Y"

export interface AdminDashboardData {
    stats: StatsResponse | null
    recentOrders: OrderResponse[]
    activityLogs: ActivityLogResponse[]
    pendingTasks: { contactRequests: number; bankTransfers: number }
    chartRange: ChartRange
    setChartRange: (range: ChartRange) => void
    chartData: { name: string; revenue: number }[]
}

export function useAdminDashboardStats(): AdminDashboardData {
    const [stats, setStats] = useState<StatsResponse | null>(null)
    const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([])
    const [chartRange, setChartRange] = useState<ChartRange>("30D")
    const [activityLogs, setActivityLogs] = useState<ActivityLogResponse[]>([])
    const [pendingTasks, setPendingTasks] = useState({ contactRequests: 0, bankTransfers: 0 })

    useEffect(() => {
        statsApi.getStats(RANGE_DAYS[chartRange]).then(setStats).catch((e) => console.error("İstatistik alınamadı:", e))
    }, [chartRange])

    useEffect(() => {
        Promise.all([
            orderApi.getAllOrders(0, 5).catch(() => ({ items: [], totalElement: 0, pageNumber: 0, pageSize: 5 })),
            activityLogApi.getAll(0, 5).catch(() => ({ items: [] })),
            contactApi.getUnreadCount().catch(() => ({ count: 0 })),
            bankTransferApi.getPendingCount().catch(() => ({ count: 0 }))
        ]).then(([ordersData, logsData, contactCount, transferCount]) => {
            setRecentOrders(ordersData.items)
            setActivityLogs(logsData.items || [])
            setPendingTasks({ contactRequests: contactCount?.count || 0, bankTransfers: transferCount?.count || 0 })
        })
    }, [])

    const chartData = stats?.dailyStats?.length
        ? stats.dailyStats.map(d => ({
            name: formatDateTR(d.date, "day-month"),
            revenue: d.revenue
        }))
        : []

    return { stats, recentOrders, activityLogs, pendingTasks, chartRange, setChartRange, chartData }
}
