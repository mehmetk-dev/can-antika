"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const CACHE_KEY = "exchange_rates_cache"
const CACHE_TTL = 5 * 60_000 // 5 minutes

interface CachedRates {
    rates: { name: string; value: string; code: string }[]
    ts: number
}

function getCachedRates(): CachedRates | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const cached: CachedRates = JSON.parse(raw)
        if (Date.now() - cached.ts < CACHE_TTL) return cached
        return null
    } catch {
        return null
    }
}

export default function ExchangeRateTicker() {
    const [exchangeRates, setExchangeRates] = useState<{ name: string; value: string; code: string }[]>([])
    const [error, setError] = useState(false)

    useEffect(() => {
        const cached = getCachedRates()
        if (cached) {
            queueMicrotask(() => setExchangeRates(cached.rates))
            return
        }

        const controller = new AbortController()

        fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error("Exchange rate API error")
                return res.json()
            })
            .then(data => {
                if (data?.rates?.TRY) {
                    const tryRate = data.rates.TRY
                    const eurRate = tryRate / data.rates.EUR
                    const gbpRate = tryRate / data.rates.GBP
                    const chfRate = tryRate / data.rates.CHF
                    const audRate = tryRate / data.rates.AUD

                    const rates = [
                        { code: "USD", name: "Dolar", value: `₺${tryRate.toFixed(2)}` },
                        { code: "EUR", name: "Euro", value: `₺${eurRate.toFixed(2)}` },
                        { code: "GBP", name: "Sterlin", value: `₺${gbpRate.toFixed(2)}` },
                        { code: "CHF", name: "Frank", value: `₺${chfRate.toFixed(2)}` },
                        { code: "AUD", name: "Avust. D.", value: `₺${audRate.toFixed(2)}` },
                    ]
                    setExchangeRates(rates)
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }))
                    } catch { /* storage full */ }
                }
            })
            .catch((err) => {
                if (err.name !== "AbortError") {
                    console.error("Döviz kuru alınamadı:", err)
                    setError(true)
                }
            })

        return () => controller.abort()
    }, [])

    return (
        <Card className="shadow-sm border-stone-200 overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className="flex items-stretch">
                    {/* Label */}
                    <div className="bg-stone-800 text-white px-4 py-2.5 flex items-center gap-2 shrink-0">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        <span className="text-[12px] font-bold tracking-wide">KUR</span>
                    </div>

                    {/* Ticker */}
                    <div className="flex-1 overflow-hidden flex items-center">
                        {exchangeRates.length > 0 ? (
                            <div className="flex items-center whitespace-nowrap gap-0 animate-ticker pr-8">
                                {[...exchangeRates, ...exchangeRates, ...exchangeRates, ...exchangeRates].map((rate, i) => (
                                    <div key={i} className="flex items-center gap-2 px-5 shrink-0">
                                        <span className="text-[11px] font-bold text-stone-400 tracking-wider">
                                            {rate.code}
                                        </span>
                                        <span className="text-[13px] font-semibold text-stone-800 tabular-nums">
                                            {rate.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <span className="flex items-center gap-1.5 text-stone-500 text-[12px] px-4 shrink-0">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Döviz verisi alınamadı
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-stone-500 text-[12px] px-4 shrink-0">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Yükleniyor...
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
