# Checkout Page Redesign Plan

## Goal
Transform the generic checkout/order page and its sub-components into a premium, antique-themed, and memorable user experience that matches the "Can Antika" brand while keeping the existing cream-and-brown color palette.

## Tasks
- [x] **Task 1: Address Selector Design Upgrade**
  - Update `components/checkout/address-selector.tsx` to use sharp corners (`rounded-[2px]`), serif typography for headers, warm parchment-like selection gradients, and custom micro-interactions.
  - *Verify:* Visual review of address cards with scale-up and warm gold glow transitions.
- [x] **Task 2: Payment Method Selector Design Upgrade**
  - Update `components/checkout/payment-method-selector.tsx` with sharp button shapes, elegant hover/active states, custom icon positioning, and style the bank transfer details block like a historical document receipt.
  - *Verify:* Switch between credit card and EFT methods, confirm the layout transitions smoothly and displays beautifully.
- [x] **Task 3: Legal Documents Panel Design Upgrade**
  - Update `components/checkout/legal-documents-panel.tsx` to display agreements in custom scrollable text boxes resembling vintage manuscripts, with neat typographic hierarchy.
  - *Verify:* Ensure text boxes are readable, scroll properly, and fit the theme.
- [x] **Task 4: Order Summary and Note Card Design Upgrade**
  - Update `components/checkout/order-summary.tsx` and the order note section in `page.tsx` to look like a vintage ledger or invoice. Make the coupon input more stylish and upgrade the checkout button with hover scaling and a premium vintage leather texture/gradient.
  - *Verify:* Cart total updates, coupon apply/remove animations, and button interaction.
- [x] **Task 5: Main Page Layout & Decorative Accents**
  - Update `app/(main)/(alisveris)/siparis/page.tsx` layout structure. Add brand typography (`font-cinzel`), letter-spacing, and subtle hand-crafted borders or divider details (e.g., small horizontal divider with diamond icon).
  - *Verify:* Visual structure of the page feels integrated and premium.
- [x] **Task 6: Verification & Validation**
  - Run linting and TypeScript compile checks in the frontend project to ensure code correctness.
  - *Verify:* `npm run lint` and `npx tsc --noEmit` pass with zero errors.

## Done When
- [x] The checkout page matches the antique brand aesthetic with sharp corners (`rounded-[2px]`), premium serif typography (`font-serif`, `font-cinzel`), and warm shadows.
- [x] The default, boring modern SaaS templates and borders are completely liquidated.
- [x] The page compiles and runs without any TypeScript or styling errors.
