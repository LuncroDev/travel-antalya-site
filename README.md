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

- `content/hotels`: 28 reviewed profiles, stable `slug`, official/source URL, `last_checked`, booking caveats. There are no live room rates, availability, invented ratings or generic photos presented as actual properties.
- `content/events`: specific editions require `date_verified: true`, valid date-only `start_date`/`end_date`, source and `last_checked`. Records lacking verified dates never appear as upcoming. The browser reclassifies dates using Europe/Istanbul time, including midnight changes. Static no-JavaScript labels reflect build time.
- `_data/destinations.json`: short introductions to all 19 districts, not exhaustive inventories of businesses or attractions.
- `admin/config.yml`: updated CMS fields preserve sources and stable hotel URLs. This change does not provision authentication or alter credentials.
- `docs/hotel-sources.md` and `docs/events-sources.md`: source registers for this refresh.

Run `npm run content:audit` to flag event source checks older than 7 days and hotel reviews older than 90 days. It is a report, not an updater. It does not scrape sources, assert re-verification, change checked dates or send notifications.

## Keeping information genuinely current

This implementation is an editorial snapshot, not an automatic source ingestion pipeline. Add newly announced events only after checking the exact edition and access terms. Never advance a festival to next year based on recurrence alone. Review cancellations and operating/renovation notices directly with the source. Review dates should represent an actual human/editorial check, not a build timestamp.

For comprehensive inventory/live availability, a licensed or contracted provider is needed (for example, a hotel partner API or an authorised ticket feed). API credentials, terms, costs, attribution and permitted reuse must be agreed before enabling integration. Keep future credentials server-side. No new keys, accounts, subscriptions or live deployment were created by this refresh.

## Publication

Changes should be reviewed on their feature branch. Netlify's checked-in build command creates `_site`. Publishing to production is a separate decision; do not merge or deploy implicitly. Keep old URLs and redirects when renaming content.
