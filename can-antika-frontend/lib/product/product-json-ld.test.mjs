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
  assert.equal("aggregateRating" in jsonLd, false)
  assert.equal("review" in jsonLd, false)
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
