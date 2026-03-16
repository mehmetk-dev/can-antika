"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ExchangeRateTicker() {
    const [exchangeRates, setExchangeRates] = useState<{ name: string; value: string }[]>([])

    useEffect(() => {
        fetch("https://api.exchangerate-api.com/v4/latest/USD")
            .then(res => res.json())
            .then(data => {
                if (data && data.rates && data.rates.TRY) {
                    const tryRate = data.rates.TRY
                    const eurRate = tryRate / data.rates.EUR
                    const chfRate = tryRate / data.rates.CHF
                    const audRate = tryRate / data.rates.AUD
                    const gbpRate = tryRate / data.rates.GBP

                    setExchangeRates([
                        { name: "USD Satış", value: `₺${tryRate.toFixed(4)}` },
                        { name: "EUR Satış", value: `₺${eurRate.toFixed(4)}` },
                        { name: "GBP Satış", value: `₺${gbpRate.toFixed(4)}` },
                        { name: "CHF Satış", value: `₺${chfRate.toFixed(4)}` },
                        { name: "AUD Satış", value: `₺${audRate.toFixed(4)}` },
                    ])
                }
            })
            .catch(() => { /* silently ignore exchange rate errors */ })
    }, [])

    return (
        <>
            <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
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
                            {exchangeRates.length === 0 && <span className="text-muted-foreground text-sm shrink-0">Yükleniyor...</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
