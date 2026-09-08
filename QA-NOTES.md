# Verification and review guide

## Redesign checks completed - 8 September 2026

- `npm run build` passed TypeScript checking and the production Vite build.
- Browser walkthroughs exercised the actual React UI at desktop and phone sizes using isolated demo sessions.
- A 36-case route/viewport sweep covered home, shop, product, About, Packaging, The Unseen, login, bag, checkout, size guide, shipping and dashboard at 320, 768 and 1440 pixels. It found no runtime errors or broken loaded image references. Three horizontal overflow cases were corrected by constraining aspect-ratio sections to their parent width; the affected routes then passed at 320, 360, 768 and 1024 pixels.
- Search results and product navigation passed. Search input, search icon and submit icon all remain inside the enclosing field at desktop and 390px widths.
- Colour and size filters combined correctly. Low-to-high price sorting returned ascending prices. Desktop and mobile filter size buttons have equal widths, a shared top edge and remain inside their grid.
- Product validation rejects adding without a size. Selecting a size, changing the image, viewing the back image, saving to wishlist and adding to the loadout passed.
- Product information tabs support mouse use and arrow-key navigation. The size-guide table renders in both the tab and dialog.
- Quick add -> size choice -> Unit added -> Continue shopping passed, with the header bag count updated.
- The Unit added dialog was checked on desktop and mobile with the new product image and working View loadout / Continue shopping actions.
- GHOST10 applied a rounded INR 150 discount to the INR 1,499 Shadow tee. Free shipping produced an INR 1,349 total.
- A complete guest demo checkout passed: address, cash-on-delivery preview, review, order confirmation and bag clearing. No real payment or shipment occurred.
- Demo login rejected empty fields, accepted sample name/email, persisted through reload and returned to login after sign-out.
- Homepage campaign switching, community carousel controls, community page navigation, local preview signup and About navigation passed.
- The production preview served the bundled font and product images without failed requests or runtime errors. The G-only splash assembled three pieces, displayed no circle, dismissed naturally and handed focus to the main content.

## Local preview

Run `npm run dev`, or run `npm run build` followed by `npm run preview` to inspect the production bundle. Routes use URL hashes and assets are bundled locally. Screenshot checks were saved outside the repository in the local temporary directory.

## Expected scope

Authentication, signup, payment, orders and courier estimates are frontend demonstrations. Community signup is stored on this device only. Product and packaging imagery is generated concept artwork; the retained older products use the existing third-party sample photos. A live store still needs its approved inventory, specifications, policies and backend services.

The dashboard displays local sample order/catalogue data. Its View catalog link opens the storefront; catalogue editing remains in `src/catalog.ts`.
