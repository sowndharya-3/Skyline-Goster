# Verification and review guide

## Completed automated checks

- Portable React source passed `tsc --noEmit`.
- Production Vite build completed successfully.
- Cart calculations: empty cart, one item with shipping, multiple items with free shipping, 10% coupon rounding and invalid coupon behaviour.
- Catalogue: unique product IDs, non-empty available sizes, positive prices and correct collection membership.
- All used product/banner image references resolve to bundled local files.
- Every banner destination maps to a populated collection.
- Catalogue remains limited to T-shirts.

No automated browser or screenshot tests were performed. Responsive alignment is implemented in CSS and should be reviewed on target devices before production.

## Connected prototype walkthrough

1. Start the app. The supplied logo displays for three seconds, then the home page appears.
2. Advance all three banners, use the slide indicators and pause/play. Click each campaign CTA.
3. Open the menu, then each collection. Use search for `black`, `full sleeve` and an unmatched term.
4. On Shop, combine size/colour/price filters. Clear them. Test all sorting options.
5. Use the heart to add/remove a wishlist item. Refresh to confirm persistence.
6. Quick add → choose a size → add. On a product detail, try Add to bag without selecting a size; then select one and add it. Unavailable sizes remain disabled.
7. Add the same product in two different sizes; confirm separate bag lines. Increase/decrease quantities, remove one and move one to wishlist.
8. Enter invalid coupon text, then `GHOST10`. Verify totals and the free-shipping threshold.
9. Checkout with sample data. Invalid email, phone or PIN should be rejected by the form.
10. Select a payment method, review/edit address, preview payment failure and then place a demo order.
11. Confirm the bag clears only after creating the demo order. View the saved order and inactive future tracking steps. Refresh to confirm the order remains.
12. Open account, enter sample name/email, edit profile, save/remove an address and sign out. This is not real account authentication.
13. Test at approximately 360px, 390px, 768px, 1024px and 1440px widths, keyboard-only operation and 200% zoom. Check modal scrolling and the mobile filter drawer.
14. Follow every footer link; use an unknown hash route to check the not-found state.

## Expected limitations

Payment, authentication, stock, courier serviceability and tracking are intentionally mocked. Sample photos and commercial content need replacement/approval before launch. The prototype is scoped to customer-facing UI; no admin application is included.
