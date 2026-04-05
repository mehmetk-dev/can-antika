"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toCloudinaryResponsiveUrl } from "@/lib/product/image-url"

export const LIGHTBOX_WIDTH = 1400

/** Lightbox için büyük boyutlu Cloudinary URL üretir — preload ile aynı URL. */
export function getLightboxUrl(resolvedSrc: string): string {
    return toCloudinaryResponsiveUrl(resolvedSrc, LIGHTBOX_WIDTH)
}

interface ImageGalleryLightboxProps {
    image: string
    productName: string
    hasMultiple: boolean
    onPrevious: () => void
    onNext: () => void
}

export function ImageGalleryLightbox({
    image,
    productName,
    hasMultiple,
    onPrevious,
    onNext,
}: ImageGalleryLightboxProps) {
    const [loaded, setLoaded] = useState(false)
    const lightboxUrl = useMemo(() => getLightboxUrl(image), [image])

    // Görsel değiştiğinde: önceden preload edilmişse anında göster, edilmemişse spinner
    useEffect(() => {
        const probe = new window.Image()
        probe.src = lightboxUrl
        if (probe.complete && probe.naturalWidth > 0) {
            // Already cached — update state in microtask to avoid sync setState in effect
            queueMicrotask(() => setLoaded(true))
        } else {
            queueMicrotask(() => setLoaded(false))
        }
    }, [lightboxUrl])

    return (
        <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl bg-background p-2 sm:p-4 border-none shadow-2xl rounded-xl">
            <DialogTitle className="sr-only">{productName}</DialogTitle>
            <DialogDescription className="sr-only">{productName} ürün görselleri galeri görünümü.</DialogDescription>
            <div className="relative h-[70vh] sm:h-[82vh] w-full flex items-center justify-center">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={lightboxUrl}
                    alt={productName}
                    className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setLoaded(true)}
                />
                {hasMultiple && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background sm:left-2 sm:h-10 sm:w-10 z-20"
                            onClick={(e) => { e.stopPropagation(); onPrevious() }}
                            aria-label="Önceki görsel"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background sm:right-2 sm:h-10 sm:w-10 z-20"
                            onClick={(e) => { e.stopPropagation(); onNext() }}
                            aria-label="Sonraki görsel"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </>
                )}
            </div>
        </DialogContent>
    )
}
