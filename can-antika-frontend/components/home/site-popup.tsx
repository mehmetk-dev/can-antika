"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { popupApi } from "@/lib/api"
import type { PopupResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

const DISMISSED_KEY = "can_antika_dismissed_popups"

function getDismissedIds(): Set<number> {
    if (typeof window === "undefined") return new Set()
    try {
        const raw = localStorage.getItem(DISMISSED_KEY)
        return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
    } catch {
        return new Set()
    }
}

function addDismissedId(id: number) {
    const ids = getDismissedIds()
    ids.add(id)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
}

export function SitePopup() {
    const [popup, setPopup] = useState<PopupResponse | null>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>
        popupApi.getActive()
            .then((popups) => {
                if (!popups || popups.length === 0) return
                const dismissed = getDismissedIds()
                const candidate = popups.find((p) => !p.showOnce || !dismissed.has(p.id))
                if (!candidate) return
                setPopup(candidate)
                const delay = (candidate.delaySeconds ?? 3) * 1000
                timer = setTimeout(() => setVisible(true), delay)
            })
            .catch(() => {
                // Sessiz — popup yüklenemezse kullanıcıyı etkileme
            })
        return () => clearTimeout(timer)
    }, [])

    const handleClose = useCallback(() => {
        if (popup?.showOnce) {
            addDismissedId(popup.id)
        }
        setVisible(false)
    }, [popup])

    if (!popup || !visible) return null

    const position = popup.position || "CENTER"

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div
                className={cn(
                    "relative mx-4 w-full max-w-md rounded-2xl bg-background shadow-2xl animate-in zoom-in-95 duration-300",
                    position === "TOP" && "self-start mt-8",
                    position === "BOTTOM" && "self-end mb-8",
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Kapatma butonu */}
                <button
                    onClick={handleClose}
                    className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Görsel */}
                {popup.imageUrl && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
                        <Image
                            src={popup.imageUrl}
                            alt={popup.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}

                {/* İçerik */}
                <div className="p-6">
                    <h2 className="font-serif text-xl font-bold text-foreground">
                        {popup.title}
                    </h2>
                    {popup.content && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {popup.content}
                        </p>
                    )}

                    {/* Butonlar */}
                    <div className="mt-5 flex gap-3">
                        {popup.linkUrl && (
                            <Button asChild className="flex-1">
                                <Link href={popup.linkUrl} onClick={handleClose}>
                                    {popup.linkText || "İncele"}
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" className="flex-1" onClick={handleClose}>
                            Kapat
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
