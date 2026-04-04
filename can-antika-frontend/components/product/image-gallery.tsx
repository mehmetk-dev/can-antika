"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { resolveImageUrl } from "@/lib/product/image-url"
import { ImageGalleryLightbox, getLightboxUrl } from "./image-gallery-lightbox"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [useFallbackImage, setUseFallbackImage] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const safeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0
  const mainImage = images[safeIndex] ? resolveImageUrl(images[safeIndex]) : "/placeholder.svg"
  const preloadedRef = useRef<Set<string>>(new Set())

  // Lightbox açılınca tüm fotoğrafları arka planda büyük boyutta preload et
  useEffect(() => {
    if (!lightboxOpen || images.length === 0) return

    // Önce şu an seçili olan fotoğrafı yükle
    const currentResolved = resolveImageUrl(images[safeIndex])
    if (currentResolved !== "/placeholder.svg") {
      const url = getLightboxUrl(currentResolved)
      if (!preloadedRef.current.has(url)) {
        const img = new window.Image()
        img.src = url
        preloadedRef.current.add(url)
      }
    }

    // Sonra diğer tüm fotoğrafları arka planda yükle
    images.forEach((image, index) => {
      if (index === safeIndex) return
      const resolved = resolveImageUrl(image)
      if (resolved === "/placeholder.svg") return
      const url = getLightboxUrl(resolved)
      if (preloadedRef.current.has(url)) return
      const img = new window.Image()
      img.src = url
      preloadedRef.current.add(url)
    })
  }, [lightboxOpen, images, safeIndex])

  const handlePrevious = useCallback(() => {
    setUseFallbackImage(false)
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setUseFallbackImage(false)
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const handleImageError = useCallback(() => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex((prev) => prev + 1)
      return
    }

    setUseFallbackImage(true)
  }, [selectedIndex, images.length])

  return (
    <div className="min-w-0 w-full space-y-4">
      {/* Main image area */}
      <div className="group relative aspect-square w-full max-w-full overflow-hidden rounded-lg bg-[#f9f7f0]">
        <Image
          src={useFallbackImage ? "/placeholder.svg" : mainImage}
          alt={productName}
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 500px"
          className="object-contain p-2 sm:p-4 object-center transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
          onError={handleImageError}
        />

        {/* Clickable overlay to open lightbox */}
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-zoom-in bg-transparent"
          onClick={() => setLightboxOpen(true)}
          aria-label={`${productName} görselini büyüt`}
        >
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
            <ZoomIn className="h-8 w-8 text-background opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </button>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={handlePrevious}
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={handleNext}
              aria-label="Sonraki görsel"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Lightbox dialog — completely separate from image area */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <ImageGalleryLightbox
          image={useFallbackImage ? "/placeholder.svg" : mainImage}
          productName={productName}
          hasMultiple={images.length > 1}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </Dialog>

      {images.length > 1 && (
        <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }}>
          {images.map((image, index) => {
            const thumbUrl = resolveImageUrl(image)
            return (
              <button
                key={`thumb-${image}-${index}`}
                onClick={() => {
                  setSelectedIndex(index)
                  setUseFallbackImage(false)
                }}
                className={`relative aspect-square w-full overflow-hidden rounded-md transition-all ${selectedIndex === index
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
                  }`}
              >
                <Image
                  src={thumbUrl}
                  alt={`${productName} - ${index + 1}`}
                  fill
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 15vw, 10vw"
                  className="object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
