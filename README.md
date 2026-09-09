# GHOSTER — React ecommerce UI

A connected dark streetwear storefront redesigned around the user-supplied GHOSTER reference: charcoal surfaces, olive accents, locally bundled condensed typography, cinematic campaign imagery and the Army / Gamer / Biker identity. Built with React 19, TypeScript and Vite. This package is a standalone React frontend; it does not require Next.js, a database, an API key or a payment account to run.

## Start locally

Install Node.js **22.13 or newer** (a current Node 22 LTS release is suitable).

Open a terminal in this folder, beside `package.json`:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To stop, press Ctrl+C.

## Browser tests

Install Google Chrome, then run:

```sh
npm run test:e2e
npm run test:e2e:report
```

The suite starts its own server at `http://127.0.0.1:5190`, uses isolated browser sessions with sample details, and checks desktop and mobile layouts. It covers navigation, search, filtering, products, bag totals, demo login, saved addresses, all four demo payment methods and persisted orders. Failed checks include screenshots and traces in `test-results/`; the HTML report is in `playwright-report/`. Both directories are ignored by Git.

Chrome is the default browser channel. To use installed Microsoft Edge in PowerShell, run `$env:PLAYWRIGHT_CHANNEL='msedge'` before the test command. The mobile project emulates a phone viewport and touch input in the selected desktop browser; it is not a real iOS/Android device test.

## Production build

```sh
npm run build
npm run preview
```

`npm run build` checks TypeScript and produces `dist/`. The generated `dist/` folder is ignored by Git; rebuild it when preparing a deployment. The bundled `package-lock.json` retains the resolved dependency versions used during development.

For ordinary static hosting, upload the **contents inside `dist/`** into the intended website or subdomain document root. Do not upload the entire source folder as the website. Confirm the target folder before replacing a previously hosted site.

The build uses relative asset paths and hash-based routes, so it works in a subfolder without server rewrite rules. Example route: `https://your-domain.example/store/#/product/shadow-oversized`. Serve over HTTP(S); do not double-click `index.html` through `file://`.

## What's included

- Original supplied GHOSTER logo PDF and wordmark. On each full page load, the G emblem assembles on its own, then the complete wordmark fades in before the site opens (about 3.2 seconds). The intro includes an Enter site button, keyboard support and a short static presentation for reduced-motion settings; route changes do not replay it.
- Responsive reference-inspired homepage: manual campaign slides, mindset banner, Army/Gamer/Biker collection cards, five-product drop, identity band, packaging feature and community carousel.
- T-shirts only: half sleeve, full sleeve, oversized and graphic collections. No fixed Men/Women categories.
- Shop page with colour, size and price filters, sorting, collection links and empty states.
- Header search with matching product suggestions and a results page.
- Product detail with thumbnail gallery and zoom, size availability, quantity, wishlist, Add to loadout confirmation, previous/next products, and keyboard-accessible Description / Details / Size guide / Shipping tabs.
- Quick add with required size selection.
- Persistent wishlist and shopping bag with separate size variants, quantities, removal and move-to-wishlist.
- Coupon `GHOST10`: 10% off the item subtotal, rounded to the nearest rupee.
- Preview shipping: ₹79 below ₹1,499 subtotal; free at or above ₹1,499. The shipping threshold uses the pre-discount subtotal.
- Guest checkout: validated address → payment-method preview → review → local order confirmation.
- Demo payment options: UPI, cards, net banking and cash on delivery. Payment-failure preview preserves the bag.
- Dedicated responsive login page at `#/login`, using the existing name/email demo sign-in with validation and guest access. Signed-out account visits redirect to login; signing in opens the account page, and signing out returns to login.
- Demo account, profile editing, saved addresses, order history and order details.
- Dedicated About, Packaging and The Unseen pages; local demo community signup; shipping/returns, size guide, FAQs, preview privacy notice and not-found state.
- Accessible Radix-based dialogs, sheets and selectors; keyboard focus, form labels, reduced-motion handling and responsive layouts.

## Important scope

**This is UI/prototype code, not a production ecommerce backend.**

- Payment success/failure is simulated. No Razorpay integration and no funds are collected.
- Login is explicitly a demo name/email flow. No OTP, password, verification or secure authentication is implemented.
- Cart, wishlist, profile, sample addresses and orders use `localStorage` under `ghoster-prototype-v1`. They are local to the browser and are not isolated by real user accounts. Use sample information.
- Add to loadout opens a confirmation with View loadout and Continue shopping. Checkout includes every item in the current bag.
- Community signup saves a preference under `ghoster-community-preview` on this device only; no emails are sent or subscribed externally.
- The PIN-code checker validates format and returns a labelled sample estimate. It does not query a courier service.
- Order tracking displays the confirmed state only; later stages remain inactive until a live shipping integration exists.
- Prices, offers, stock, material specifications, delivery estimates and size measurements are sample content, not approved commercial commitments.
- Admin category management is not part of this customer UI deliverable. Collections and products are data-driven in `src/catalog.ts`, ready to be supplied by an API later.

## Main files

| File | Purpose |
|---|---|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Shared header/footer, splash integration, routing, quick add and loadout confirmation |
| `src/SplashScreen.tsx` | G formation, wordmark reveal, skip action and accessible page handoff |
| `src/splash.css` | Responsive splash animation and reduced-motion presentation |
| `src/LoginPage.tsx` | Dedicated demo sign-in, form validation and account navigation |
| `src/login.css` | Responsive login page styling |
| `src/BrandPages.tsx` | Homepage, About, Packaging, The Unseen, brand lockup and signup |
| `src/ProductPage.tsx` | Product gallery, purchasing controls and information tabs |
| `src/shop.tsx` | Shop, filters, wishlist and size guide |
| `src/pages.tsx` | Bag, checkout, account, orders and information pages |
| `src/catalog.ts` | Brand metadata, collections, products, banners and currency formatting |
| `src/store.tsx` | React state, local persistence, cart totals and hash routing |
| `src/ui.tsx` | Shared storefront controls and cards |
| `src/styles.css` | Existing responsive layout and transactional components |
| `src/theme.css` | Charcoal/olive design system, page sections and responsive refinements |
| `app/globals.css` | Tailwind and shared component theme tokens; CSS only, not a Next.js app |
| `components/ui/` | Accessible reused UI primitives |
| `public/assets/` | Local logo, generated campaign/product concepts, legacy images and fonts |
| `public/assets/campaign-sources.json` | Generated image filenames, exact prompts and generation method |
| `reference/GHOSTER-original-logo.pdf` | Original supplied logo |
| `ASSET-CREDITS.md` | Photo sourcing and replacement notes |
| `QA-NOTES.md` | Checks performed and manual walkthrough |

## Before connecting a backend

1. Replace `products`, `collections` and `banners` with API data. Use stable IDs and actual size/stock values.
2. Replace demo account/local storage with secure server authentication and per-customer records.
3. Recalculate price, discounts, shipping, tax and stock on the server. Never trust browser totals for a real order.
4. Create payment orders server-side, integrate the approved gateway and verify payment webhooks before confirming payment.
5. Connect address serviceability, shipping creation, real tracking, inventory and returns.
6. Replace the sample photos and catalogue content with approved GHOSTER assets. Add the actual support contacts and approved policies.

## Reset the demo

Open `#/info/privacy` and click **Clear prototype data**, or remove `ghoster-prototype-v1` and `ghoster-community-preview` from the browser's local storage.
