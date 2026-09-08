# GHOSTER — React ecommerce UI

A connected, black-and-white T-shirt storefront prototype inspired by the layout rhythm of https://www.snitch.com/. Built with React 19, TypeScript and Vite. This package is a standalone React frontend; it does not require Next.js, a database, an API key or a payment account to run.

## Start locally

Install Node.js **22.13 or newer** (a current Node 22 LTS release is suitable).

Open a terminal in this folder, beside `package.json`:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To stop, press Ctrl+C.

## Production build

```sh
npm run build
npm run preview
```

`npm run build` checks TypeScript and produces `dist/`. A prebuilt `dist/` is already included. The bundled `package-lock.json` retains the resolved dependency versions used during development.

For ordinary static hosting, upload the **contents inside `dist/`** into the intended website or subdomain document root. Do not upload the entire source folder as the website. Confirm the target folder before replacing a previously hosted site.

The build uses relative asset paths and hash-based routes, so it works in a subfolder without server rewrite rules. Example route: `https://your-domain.example/store/#/product/shadow-oversized`. Serve over HTTP(S); do not double-click `index.html` through `file://`.

## What's included

- Original supplied GHOSTER logo PDF and wordmark. On each full page load, the G emblem assembles on its own, then the complete wordmark fades in before the site opens (about 3.2 seconds). The intro includes an Enter site button, keyboard support and a short static presentation for reduced-motion settings; route changes do not replay it.
- Responsive home page, three image banners with autoplay, manual arrows, slide indicators, pause/play and clickable collection destinations.
- T-shirts only: half sleeve, full sleeve, oversized and graphic collections. No fixed Men/Women categories.
- Shop page with colour, size and price filters, sorting, collection links and empty states.
- Header search with matching product suggestions and a results page.
- Product detail, enlarged photo, size availability, size guide, quantity selector, wishlist, Add to bag and Buy now.
- Quick add with required size selection.
- Persistent wishlist and shopping bag with separate size variants, quantities, removal and move-to-wishlist.
- Coupon `GHOST10`: 10% off the item subtotal, rounded to the nearest rupee.
- Preview shipping: ₹79 below ₹1,499 subtotal; free at or above ₹1,499. The shipping threshold uses the pre-discount subtotal.
- Guest checkout: validated address → payment-method preview → review → local order confirmation.
- Demo payment options: UPI, cards, net banking and cash on delivery. Payment-failure preview preserves the bag.
- Dedicated responsive login page at `#/login`, using the existing name/email demo sign-in with validation and guest access. Signed-out account visits redirect to login; signing in opens the account page, and signing out returns to login.
- Demo account, profile editing, saved addresses, order history and order details.
- About, shipping/returns, size guide, FAQs, preview privacy notice and not-found state.
- Accessible Radix-based dialogs, sheets and selectors; keyboard focus, form labels, reduced-motion handling and responsive layouts.

## Important scope

**This is UI/prototype code, not a production ecommerce backend.**

- Payment success/failure is simulated. No Razorpay integration and no funds are collected.
- Login is explicitly a demo name/email flow. No OTP, password, verification or secure authentication is implemented.
- Cart, wishlist, profile, sample addresses and orders use `localStorage` under `ghoster-prototype-v1`. They are local to the browser and are not isolated by real user accounts. Use sample information.
- Buy now adds the selected variant to the bag and takes the user directly to checkout; the existing bag remains included.
- The PIN-code checker validates format and returns a labelled sample estimate. It does not query a courier service.
- Order tracking displays the confirmed state only; later stages remain inactive until a live shipping integration exists.
- Prices, offers, stock, material specifications, delivery estimates and size measurements are sample content, not approved commercial commitments.
- Admin category management is not part of this customer UI deliverable. Collections and products are data-driven in `src/catalog.ts`, ready to be supplied by an API later.

## Main files

| File | Purpose |
|---|---|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Shared header/footer, splash integration, navigation, home page and quick add |
| `src/SplashScreen.tsx` | G formation, wordmark reveal, skip action and accessible page handoff |
| `src/splash.css` | Responsive splash animation and reduced-motion presentation |
| `src/LoginPage.tsx` | Dedicated demo sign-in, form validation and account navigation |
| `src/login.css` | Responsive login page styling |
| `src/shop.tsx` | Shop, filters, wishlist, product page and size guide |
| `src/pages.tsx` | Bag, checkout, account, orders and information pages |
| `src/catalog.ts` | Brand metadata, collections, products, banners and currency formatting |
| `src/store.tsx` | React state, local persistence, cart totals and hash routing |
| `src/ui.tsx` | Shared storefront controls and cards |
| `src/styles.css` | Responsive black-and-white design |
| `app/globals.css` | Tailwind and shared component theme tokens; CSS only, not a Next.js app |
| `components/ui/` | Accessible reused UI primitives |
| `public/assets/` | Bundled local images and logo |
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

Open `#/info/privacy` and click **Clear prototype data**, or remove `ghoster-prototype-v1` from the browser's local storage.
