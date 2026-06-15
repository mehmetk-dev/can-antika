"use client"

import { useState, type MouseEvent } from "react"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { wishlistApi } from "@/lib/api"
import { useAuth } from "@/lib/auth/auth-context"
import { cn, getErrorMessage } from "@/lib/utils"

interface ProductFavoriteButtonProps {
  productId: number
  className?: string
}

export function ProductFavoriteButton({ productId, className }: ProductFavoriteButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (authLoading) {
      toast.info("Oturum bilgileriniz kontrol ediliyor, lütfen tekrar deneyin.")
      return
    }

    if (!isAuthenticated) {
      toast.info("Favorilere eklemek için giriş yapmalısınız.", {
        duration: 5000,
        action: {
          label: "Giriş Yap",
          onClick: () => {
            window.location.href = "/giris"
          },
        },
      })
      return
    }

    if (isAdding) return
    if (isAdded) {
      toast.info("Bu ürün zaten favorilerinizde.")
      return
    }

    setIsAdding(true)
    try {
      await wishlistApi.addItem(productId)
      setIsAdded(true)
      toast.success("Ürün favorilere eklendi.")
    } catch (error) {
      toast.error(getErrorMessage(error, "Favorilere eklenirken hata oluştu."))
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isAdded ? "Ürün favorilerde" : "Favorilere ekle"}
      aria-pressed={isAdded}
      className={cn(
        "h-9 w-9 rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background",
        isAdded && "text-red-600",
        className
      )}
      onClick={handleClick}
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", isAdded && "fill-current")} />
      )}
    </Button>
  )
}
