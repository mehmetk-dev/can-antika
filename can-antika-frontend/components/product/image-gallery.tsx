"use client"

import { useState } from "react"
import Image from "next/image"
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { isCloudinaryImageUrl, resolveImageUrl, toCloudinaryResponsiveUrl } from "@/lib/image-url"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [useFallbackImage, setUseFallbackImage] = useState(false)

  const safeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0
  const mainImage = images[safeIndex] ? resolveImageUrl(images[safeIndex]) : "/placeholder.svg"
  const useCloudinaryLoader = isCloudinaryImageUrl(mainImage)

  const handlePrevious = () => {
    setUseFallbackImage(false)
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setUseFallbackImage(false)
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleImageError = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex((prev) => prev + 1)
      return
    }

    setUseFallbackImage(true)
  }

  const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return toCloudinaryResponsiveUrl(src, width, quality ?? 75)
  }

  return (
    <div className="min-w-0 w-full space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <div className="group relative aspect-[3/4] w-full max-w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted">
            <Image
              src={useFallbackImage ? "/placeholder.svg" : mainImage}
              alt={productName}
              fill
              priority
              loader={useCloudinaryLoader ? cloudinaryLoader : undefined}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 52vw, 42vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
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
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-5xl bg-background p-2">
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          <DialogDescription className="sr-only">{productName} ürün görselleri galeri görünümü.</DialogDescription>
          <div className="relative aspect-[3/4] w-full max-h-[85vh]">
            <Image
              src={useFallbackImage ? "/placeholder.svg" : mainImage}
              alt={productName}
              fill
              loading="lazy"
              decoding="async"
              loader={useCloudinaryLoader ? cloudinaryLoader : undefined}
              sizes="85vw"
              className="object-contain"
              onError={handleImageError}
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {images.length > 1 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index)
                setUseFallbackImage(false)
              }}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-md transition-all ${
                selectedIndex === index ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={resolveImageUrl(image)}
                alt={`${productName} - ${index + 1}`}
                fill
                loading="lazy"
                decoding="async"
                loader={isCloudinaryImageUrl(resolveImageUrl(image)) ? cloudinaryLoader : undefined}
                sizes="80px"
                className="object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
