"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"


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
    return (
        <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl bg-background p-2 sm:p-4 border-none shadow-2xl rounded-xl">
            <DialogTitle className="sr-only">{productName}</DialogTitle>
            <DialogDescription className="sr-only">{productName} ürün görselleri galeri görünümü.</DialogDescription>
            <div className="relative h-[70vh] sm:h-[82vh] w-full">
                <Image
                    src={image}
                    alt={productName}
                    fill
                    priority
                    sizes="(max-width: 640px) 96vw, 90vw"
                    className="object-contain"
                />
                {hasMultiple && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background sm:left-2 sm:h-10 sm:w-10"
                            onClick={(e) => { e.stopPropagation(); onPrevious() }}
                            aria-label="Önceki görsel"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 hover:bg-background sm:right-2 sm:h-10 sm:w-10"
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
