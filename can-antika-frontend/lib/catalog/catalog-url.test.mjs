import test from "node:test"
import assert from "node:assert/strict"

import {
  areCatalogFiltersUrlBacked,
  buildCatalogPageUrl,
  parseCatalogPageParam,
  parseCatalogSortParam,
} from "./catalog-url.ts"

test("parses public catalog page params as one-based and returns zero-based API page", () => {
  assert.equal(parseCatalogPageParam(undefined), 0)
  assert.equal(parseCatalogPageParam("1"), 0)
  assert.equal(parseCatalogPageParam("2"), 1)
  assert.equal(parseCatalogPageParam("0"), 0)
  assert.equal(parseCatalogPageParam("-4"), 0)
  assert.equal(parseCatalogPageParam("abc"), 0)
})

test("builds canonical catalog page URLs without invalid page values", () => {
  const params = new URLSearchParams("category=Porselen&page=3")

  assert.equal(buildCatalogPageUrl(params, 0), "/urunler?category=Porselen")
  assert.equal(buildCatalogPageUrl(params, 1), "/urunler?category=Porselen&page=2")
  assert.equal(buildCatalogPageUrl(params, -1), "/urunler?category=Porselen")
})

test("normalizes unsupported catalog sort params to newest", () => {
  assert.equal(parseCatalogSortParam(undefined), "newest")
  assert.equal(parseCatalogSortParam("price-asc"), "price-asc")
  assert.equal(parseCatalogSortParam("unknown"), "newest")
})

test("detects whether active catalog filters are fully represented by the URL", () => {
  assert.equal(
    areCatalogFiltersUrlBacked(
      { categories: ["12"], periods: ["4"], priceRanges: [], customMinPrice: "", customMaxPrice: "" },
      { categoryId: "12", periodId: "4" },
    ),
    true,
  )

  assert.equal(
    areCatalogFiltersUrlBacked(
      { categories: ["12", "13"], periods: ["4"], priceRanges: [], customMinPrice: "", customMaxPrice: "" },
      { categoryId: "12", periodId: "4" },
    ),
    false,
  )

  assert.equal(
    areCatalogFiltersUrlBacked(
      { categories: ["12"], periods: ["4"], priceRanges: ["1000-5000"], customMinPrice: "", customMaxPrice: "" },
      { categoryId: "12", periodId: "4" },
    ),
    false,
  )
})
