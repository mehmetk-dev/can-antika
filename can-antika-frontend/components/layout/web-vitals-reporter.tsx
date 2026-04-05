"use client"

import { useEffect } from "react"

export function WebVitalsReporter() {
    useEffect(() => {
        // Dynamically import web-vitals to avoid adding to main bundle
        // Falls back gracefully if package is not installed
        import("web-vitals")
            .then(({ onCLS, onLCP, onINP }) => {
                const sendToAnalytics = (metric: { name: string; value: number; id: string }) => {
                    if (typeof window.gtag !== "function") return
                    window.gtag("event", metric.name, {
                        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
                        event_label: metric.id,
                        non_interaction: true,
                    })
                }

                onCLS(sendToAnalytics)
                onLCP(sendToAnalytics)
                onINP(sendToAnalytics)
            })
            .catch(() => {
                // web-vitals not installed — skip silently
            })
    }, [])

    return null
}
