"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
    data: { name: string; revenue: number }[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg">
                Yeterli veri bulunmuyor.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(val) => Math.floor(val).toString()} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`₺${val}`, 'Ciro']} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    )
}
