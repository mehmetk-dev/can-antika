"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const CACHE_KEY = "exchange_rates_cache"
const CACHE_TTL = 5 * 60_000 // 5 minutes

interface CachedRates {
    rates: { name: string; value: string }[]
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
    const [exchangeRates, setExchangeRates] = useState<{ name: string; value: string }[]>([])
    const [error, setError] = useState(false)

    useEffect(() => {
        // Try cache first
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
                if (data && data.rates && data.rates.TRY) {
                    const tryRate = data.rates.TRY
                    const eurRate = tryRate / data.rates.EUR
                    const chfRate = tryRate / data.rates.CHF
                    const audRate = tryRate / data.rates.AUD
                    const gbpRate = tryRate / data.rates.GBP

                    const rates = [
                        { name: "USD Satış", value: `₺${tryRate.toFixed(4)}` },
                        { name: "EUR Satış", value: `₺${eurRate.toFixed(4)}` },
                        { name: "GBP Satış", value: `₺${gbpRate.toFixed(4)}` },
                        { name: "CHF Satış", value: `₺${chfRate.toFixed(4)}` },
                        { name: "AUD Satış", value: `₺${audRate.toFixed(4)}` },
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
        <>
            <Card className="shadow-xs border-border/50 overflow-hidden relative">
                <CardContent className="p-0 flex items-stretch">
                    <div className="bg-emerald-700 text-emerald-50 px-4 py-2 flex items-center gap-2 m-1 rounded-md shrink-0 text-sm font-medium z-10 relative shadow-sm">
                        <RefreshCw className="h-4 w-4" />
                        Döviz Kurları
                    </div>
                    <div className="flex-1 overflow-hidden flex items-center bg-transparent">
                        <div className="flex items-center whitespace-nowrap gap-8 animate-ticker pr-8 relative">
                            {[...exchangeRates, ...exchangeRates, ...exchangeRates, ...exchangeRates].map((rate, i) => (
                                <span key={i} className="flex items-center gap-1 shrink-0">
                                    <span className="font-semibold text-foreground">{rate.name}:</span>
                                    <span className="text-emerald-500 font-medium">{rate.value}</span>
                                </span>
                            ))}
                            {exchangeRates.length === 0 && !error && <span className="text-muted-foreground text-sm shrink-0">Yükleniyor...</span>}
                            {error && (
                                <span className="flex items-center gap-1.5 text-muted-foreground text-sm shrink-0">
                                    <AlertCircle className="h-4 w-4" />
                                    Döviz verisi alınamadı
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
