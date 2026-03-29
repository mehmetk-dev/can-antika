"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { isCloudinaryImageUrl, resolveImageUrl, toCloudinaryResponsiveUrl } from "@/lib/product/image-url"
import { ImageGalleryLightbox } from "./image-gallery-lightbox"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [useFallbackImage, setUseFallbackImage] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const safeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0
  const mainImage = images[safeIndex] ? resolveImageUrl(images[safeIndex]) : "/placeholder.svg"
  const useCloudinaryLoader = isCloudinaryImageUrl(mainImage)

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

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return toCloudinaryResponsiveUrl(src, width, quality ?? 75)
  }

  return (
    <div className="min-w-0 w-full space-y-4">
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative aspect-[3/4] w-full max-w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted block"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={useFallbackImage ? "/placeholder.svg" : mainImage}
              alt={productName}
              fill
              priority
              loader={useCloudinaryLoader ? cloudinaryLoader : undefined}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 52vw, 42vw"
              className="object-cover object-center transition-transform duration-300 will-change-transform group-hover:scale-[1.02]"
              onError={handleImageError}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
              <ZoomIn className="h-8 w-8 text-background opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevious()
                  }}
                  aria-label="Önceki görsel"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  aria-label="Sonraki görsel"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </button>
        </DialogTrigger>

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
                  loader={isCloudinaryImageUrl(thumbUrl) ? cloudinaryLoader : undefined}
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
