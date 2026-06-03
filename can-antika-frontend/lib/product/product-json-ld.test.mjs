import test from "node:test"
import assert from "node:assert/strict"

import { buildProductJsonLd } from "./product-json-ld.ts"

test("builds truthful merchant product JSON-LD without fake review data", () => {
  const jsonLd = buildProductJsonLd(
    {
      id: 7,
      title: "Osmanli Tabak",
      slug: "osmanli-tabak-7",
      description: "El yapimi antika tabak.",
      price: 1250,
      stock: 1,
      imageUrls: ["https://cdn.example.com/tabak.jpg"],
      averageRating: 0,
      reviewCount: 0,
    },
    {
      storeName: "Can Antika",
      freeShippingMin: 5000,
      expressShippingFee: 50,
      shippingDurationDays: 5,
    },
  )

  assert.equal(jsonLd.brand.name, "Can Antika")
  assert.equal(jsonLd.sku, "CAN-0007")
  assert.equal(jsonLd.identifierExists, false)
  assert.equal(jsonLd.offers.url, "https://canantika.com/urun/osmanli-tabak-7")
  assert.equal(jsonLd.offers.itemCondition, "https://schema.org/UsedCondition")
  assert.equal(jsonLd.offers.shippingDetails.shippingRate.value, 50)
  assert.equal(jsonLd.offers.shippingDetails.deliveryTime.transitTime.maxValue, 5)
  assert.equal(jsonLd.offers.hasMerchantReturnPolicy.merchantReturnDays, 14)
  assert.deepEqual(jsonLd.image, ["https://cdn.example.com/tabak.jpg"])
  assert.equal("aggregateRating" in jsonLd, false)
  assert.equal("review" in jsonLd, false)
})

test("normalizes product JSON-LD images to absolute URLs", () => {
  const jsonLd = buildProductJsonLd({
    id: 18,
    title: "Antika Vazo",
    slug: "antika-vazo-18",
    price: 900,
    stock: 1,
    imageUrls: ["/images/vazo.jpg", "urunler/vazo-detay.jpg"],
  })

  assert.deepEqual(jsonLd.image, [
    "https://canantika.com/images/vazo.jpg",
    "https://res.cloudinary.com/dqlbenxvc/image/upload/f_auto,q_auto,c_limit,w_1200/can-antika/urunler/vazo-detay.jpg",
  ])
})

test("omits product JSON-LD image when no usable image URL exists", () => {
  const jsonLd = buildProductJsonLd({
    id: 19,
    title: "Antika Ayna",
    slug: "antika-ayna-19",
    price: 1100,
    stock: 1,
    imageUrls: ["", "   "],
  })

  assert.equal("image" in jsonLd, false)
})

test("includes aggregate rating only when the product has real reviews", () => {
  const jsonLd = buildProductJsonLd(
    {
      id: 12,
      title: "Bronz Heykel",
      price: 3000,
      stock: 0,
      averageRating: 4.5,
      reviewCount: 2,
    },
    {
      storeName: "Can Antika",
      shippingDurationDays: 3,
    },
  )

  assert.deepEqual(jsonLd.aggregateRating, {
    "@type": "AggregateRating",
    ratingValue: 4.5,
    reviewCount: 2,
    bestRating: 5,
    worstRating: 1,
  })
})
