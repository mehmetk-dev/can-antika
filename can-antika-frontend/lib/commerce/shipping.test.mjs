import test from "node:test"
import assert from "node:assert/strict"

import { calculateShippingAmount } from "./shipping.ts"

test("charges configured shipping fee below the free shipping threshold", () => {
  assert.equal(calculateShippingAmount(100, { freeShippingMin: 500, expressShippingFee: 50 }), 50)
})

test("returns free shipping at or above the configured threshold", () => {
  assert.equal(calculateShippingAmount(500, { freeShippingMin: 500, expressShippingFee: 50 }), 0)
  assert.equal(calculateShippingAmount(750, { freeShippingMin: 500, expressShippingFee: 50 }), 0)
})
