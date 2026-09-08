# Assets and reference

## Logo

`reference/GHOSTER-original-logo.pdf` is the logo supplied by the user. The splash uses its original artwork, including the small tricolour accent. The header and footer use the original white wordmark and a monochrome cropped emblem on the new dark background.

## Current redesign reference

The user supplied a dark GHOSTER desktop/product/mobile/About composition on 8 September 2026. The current React implementation follows that reference with charcoal surfaces, olive borders, condensed uppercase headings and the same homepage section order. New raster campaign and product concept assets were generated with the built-in OpenAI image-generation tool and copied into `public/assets/` as compressed JPEG files. They are concept imagery, not photographs of manufactured inventory or real community members.

Exact prompts, methods and final filenames are recorded in `public/assets/campaign-sources.json`. The original logo was supplied as a brand reference for the hero, packaging and product generations. The six campaign files are `campaign-hero`, `campaign-army`, `campaign-gamer`, `campaign-biker`, `campaign-about` and `campaign-packaging`; the six product files are `product-shadow`, `product-shadow-back`, `product-eclipse`, `product-tactical`, `product-apex` and `product-strike` (all `.jpg`).

## Typography

Barlow Condensed Regular and SemiBold are bundled locally under `public/assets/fonts/`, sourced from the Google Fonts repository (`google/fonts/ofl/barlowcondensed`). Their SIL Open Font License is included as `OFL-BarlowCondensed.txt`. No external font requests are needed at runtime.

## Earlier layout reference

https://www.snitch.com/ was inspected on 8 September 2026. Observed patterns used as inspiration: centred brand header with menu/search/bag/wishlist/profile controls, full-width multi-slide campaign imagery, category tiles, an offer section, trending collection filters and product grids. The GHOSTER layout and copy were authored for this T-shirt-only brief; Snitch's source code was not copied.

## Sample photography

The photos bundled here are **third-party sample imagery for reviewing this prototype**. They are not official GHOSTER product photographs, and a commercial reuse licence has not been established. Some photos contain the originating brand's artwork. Replace them with owned/licensed GHOSTER photographs before production or external commercial publication.

Exact observed source pages and image URLs are recorded in `public/assets/image-sources.json`. The downloaded images were optimised to local WebP files; their filename stems map to that manifest. The failed black-classic candidate in the manifest is not used.

| Bundled image | Used for |
|---|---|
| `white-graphic.webp` | Legacy Street Oversized Tee |
| `black-oversized.webp` | Legacy oversized category reference |
| `raglan-longsleeve.webp` | Legacy full-sleeve category and Contrast tee |
| `white-oversized.webp` | Off Duty tee |
| `white-art-oversized.webp` | Graphic category and Unseen tee |
| `black-longsleeve.webp` | Afterhours tee |
| `hero-white.webp` | Half-sleeve category and Essential tee |
| `hero-concrete.webp` | Legacy Concrete tee |

Product names, descriptions and sample prices in the prototype are demonstration content. They do not establish the specifications of the garments pictured.
