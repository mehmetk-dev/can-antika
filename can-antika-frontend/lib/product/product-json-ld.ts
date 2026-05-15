import type { ProductResponse } from "../types"

const SITE_URL = "https://canantika.com"
const RETURN_POLICY_URL = `${SITE_URL}/iade`
const DEFAULT_CLOUDINARY_BASE = "https://res.cloudinary.com/dqlbenxvc/image/upload/can-antika"

interface ProductJsonLdSettings {
  storeName?: string | null
  shippingDurationDays?: number | null
  freeShippingMin?: number | null
  expressShippingFee?: number | null
}

interface OfferShippingDetails {
  "@type": "OfferShippingDetails"
  shippingRate: {
    "@type": "MonetaryAmount"
    value: number
    currency: "TRY"
  }
  shippingDestination: {
    "@type": "DefinedRegion"
    addressCountry: "TR"
  }
  deliveryTime: {
    "@type": "ShippingDeliveryTime"
    handlingTime: {
      "@type": "QuantitativeValue"
      minValue: number
      maxValue: number
      unitCode: "DAY"
    }
    transitTime: {
      "@type": "QuantitativeValue"
      minValue: number
      maxValue: number
      unitCode: "DAY"
    }
  }
}

interface ProductJsonLd {
  "@context": "https://schema.org"
  "@type": "Product"
  name: string
  description?: string
  image?: string | string[]
  sku: string
  mpn: string
  identifierExists: false
  brand: {
    "@type": "Brand"
    name: string
  }
  offers: {
    "@type": "Offer"
    url: string
    price: number
    priceCurrency: "TRY"
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock"
    itemCondition: "https://schema.org/UsedCondition"
    shippingDetails: OfferShippingDetails
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy"
      applicableCountry: "TR"
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow"
      merchantReturnDays: 14
      returnMethod: "https://schema.org/ReturnByMail"
      returnFees: "https://schema.org/FreeReturn"
      merchantReturnLink: string
    }
  }
  aggregateRating?: {
    "@type": "AggregateRating"
    ratingValue: number
    reviewCount: number
    bestRating: 5
    worstRating: 1
  }
}

function getProductPath(product: Pick<ProductResponse, "id" | "slug">): string {
  if (!product.slug) return `/urun/${product.id}`
  return product.slug.endsWith(`-${product.id}`)
    ? `/urun/${product.slug}`
    : `/urun/${product.slug}-${product.id}`
}

function getShippingDurationDays(settings: ProductJsonLdSettings): number {
  const days = settings.shippingDurationDays
  return Number.isFinite(days) && days != null && days >= 0 ? Math.round(days) : 5
}

function calculateProductShippingAmount(product: ProductResponse, settings: ProductJsonLdSettings): number {
  const price = product.price
  if (!Number.isFinite(price) || price <= 0) return 0

  const freeShippingMin = settings.freeShippingMin ?? 0
  if (freeShippingMin > 0 && price >= freeShippingMin) return 0

  return Math.max(settings.expressShippingFee ?? 0, 0)
}

function resolveStructuredImageUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return `${SITE_URL}/placeholder.svg`
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("/")) return new URL(value, SITE_URL).toString()

  const base = (process.env.NEXT_PUBLIC_CLOUDINARY_BASE || DEFAULT_CLOUDINARY_BASE).replace(/\/$/, "")
  const url = `${base}/${encodeURI(value.replace(/^\/+/, ""))}`
  return url.includes("/upload/") && !url.includes("/f_auto") && !url.includes("/q_auto")
    ? url.replace("/upload/", "/upload/f_auto,q_auto/")
    : url
}

export function buildProductJsonLd(
  product: ProductResponse,
  settings: ProductJsonLdSettings = {},
): ProductJsonLd {
  const storeName = settings.storeName?.trim() || "Can Antika"
  const reviewCount = product.reviewCount ?? 0
  const averageRating = product.averageRating
  const hasRealReviews =
    averageRating != null &&
    Number.isFinite(averageRating) &&
    reviewCount > 0
  const imageUrls = product.imageUrls
    ?.filter((url) => url.trim())
    .slice(0, 3)
    .map(resolveStructuredImageUrl)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ? product.description.slice(0, 5000) : undefined,
    ...(imageUrls && imageUrls.length > 0 ? { image: imageUrls } : {}),
    sku: `CAN-${product.id.toString().padStart(4, "0")}`,
    mpn: `CAN-${product.id.toString().padStart(4, "0")}`,
    identifierExists: false,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${getProductPath(product)}`,
      price: product.price,
      priceCurrency: "TRY",
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: calculateProductShippingAmount(product, settings),
          currency: "TRY",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: getShippingDurationDays(settings),
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        merchantReturnLink: RETURN_POLICY_URL,
      },
    },
    ...(hasRealReviews && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }
}
