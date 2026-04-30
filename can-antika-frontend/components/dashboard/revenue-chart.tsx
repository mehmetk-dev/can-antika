"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
    data: { name: string; revenue: number }[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-stone-400 dark:text-stone-500">
                Yeterli veri bulunmuyor.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    dy={8}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : Math.floor(val).toString()}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
                        fontSize: "12px",
                        padding: "8px 12px",
                    }}
                    formatter={(val) => [`₺${Number(val).toLocaleString("tr-TR")}`, "Ciro"]}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginBottom: "4px" }}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4, stroke: "#d97706", strokeWidth: 2, fill: "hsl(var(--card))" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
