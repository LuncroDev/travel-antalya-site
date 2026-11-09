# Travel Antalya

An Eleventy travel guide for travel-antalya.com. The site remains English-language, matching the existing audience and URLs.

## Development

Node.js 20+ and npm are required.

```sh
npm ci
npm run serve
npm run validate
npm run content:audit
```

`npm run build` cleans `_site`, renders pages and generates the sitemap from the actual output, including all pagination pages. Deploy `_site`, not the repository root. `npm run validate` runs data tests, a clean production build, metadata/JSON-LD checks, internal link and asset checks, sitemap coverage, and redirect-cycle checks.

Browser tests:

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

To use an existing browser: set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable. The test server binds only to 127.0.0.1. The browser suite covers desktop/mobile search, hotel filters and reset, event expiry/archive/date filters, navigation, zero-results and JavaScript-disabled content. If the execution environment prevents Chromium launching or local network access, report this as blocked, not passed.

## Editorial content

- `content/hotels`: 100 source-linked profiles, stable `slug`, official/source URL, `last_checked`, booking caveats. There are no live room rates, availability, invented ratings or generic photos presented as actual properties.
- `content/events`: specific editions require `date_verified: true`, valid date-only `start_date`/`end_date`, source and `last_checked`. Records lacking verified dates never appear as upcoming. The browser reclassifies dates using Europe/Istanbul time, including midnight changes. Static no-JavaScript labels reflect build time.
- `_data/destinations.json`: short introductions to all 19 districts, not exhaustive inventories of businesses or attractions.
- `admin/config.yml`: updated CMS fields preserve sources and stable hotel URLs. This change does not provision authentication or alter credentials.
- `docs/hotel-sources.md` and `docs/events-sources.md`: source registers for this refresh.

Run `npm run content:audit` to flag event source checks older than 7 days and hotel reviews older than 90 days. It is a report, not an updater. It does not scrape sources, assert re-verification, change checked dates or send notifications.

## Expanded guide, November 2026

- 100 hotel profiles, 69 event/session records (57 newly sourced dated sessions), 27 restaurant profiles including two preserved legacy addresses, and 11 golf venues.
- The 2026 Michelin restaurant selection does not cover Antalya. Branch-specific recognition elsewhere is not copied to Antalya. The earlier hotel article now distinguishes hotel selection, Keys and restaurant awards.
- New photography is documented in `_data/editorialPhotos.json`. Galleries distinguish district photographs from dated property archives; most hotels do not yet have cleared current property photographs. Do not substitute destination images for room/facility photography.
- A November 9 property-photo review adds 24 new licensed sources and rechecks 5 existing photographs across 9 hotels. Selected galleries show at most four property photographs with archive dates, source links and licence credits; full framing and watermarks are preserved. The remaining hotels are not represented as having current verified property photos. Details are in `docs/hotel-photo-sources.json`.
- `npm run content:audit` reports source-review age. `node scripts/audit-media.js` reports actual gallery coverage and missing property images. Neither changes verification dates.
- Source registers are in `docs/*sources.json`; they record the review and known uncertainty, not a live data licence.
- Restaurant/golf filters, source panels, official links and cross-links are tested. Known closure/identity notices remain visible.

## Keeping information genuinely current

This implementation is an editorial snapshot, not an automatic source ingestion pipeline. Add newly announced events only after checking the exact edition and access terms. Never advance a festival to next year based on recurrence alone. Review cancellations and operating/renovation notices directly with the source. Review dates should represent an actual human/editorial check, not a build timestamp.

For comprehensive inventory/live availability, a licensed or contracted provider is needed (for example, a hotel partner API or an authorised ticket feed). API credentials, terms, costs, attribution and permitted reuse must be agreed before enabling integration. Keep future credentials server-side. No new keys, accounts or subscriptions were created. Publication uses the existing repository and Netlify workflow after explicit approval.

## Publication

Changes should be reviewed on their feature branch. Netlify's checked-in build command creates `_site`. Publishing to production is a separate decision; do not merge or deploy implicitly. Keep old URLs and redirects when renaming content.
