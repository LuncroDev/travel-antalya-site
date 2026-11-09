# Events: source audit and maintenance

Reviewed: **2026-11-09**, using official organizer, venue, government and ticket-calendar pages. These are editorial snapshots, not a live feed. Do not advance the review date automatically during builds.

| Record | Verified dates | Evidence |
| --- | --- | --- |
| COP31 Antalya | 9–20 November 2026 | https://unfccc.int/cop31/ifp (UNFCCC participant information; accredited conference, not ordinary attraction entry) |
| Carmina Burana | 12 November 2026, 20:00 | https://www.sanatcepte.gov.tr/etkinlik/etkinlik-detay/carmina-burana-antalya-dob |
| Growtech | 24–27 November 2026 | https://www.anfas.com.tr/tr/fuarlar (official venue calendar; industry fair, check visitor registration) |
| The Nutcracker | 28 November 2026, 15:00–17:10 | https://www.kulturportali.gov.tr/turkiye/antalya/etkinlik/findikkiran-63 (ages 7+, two acts) |
| Runtalya | 4 April 2027 | https://www.tursetsports.com/en/races/runtalya-register (organizer; fees not announced at review) |
| Aspendos Festival | 12–26 September 2026 | https://kulturportali.gov.tr/turkiye/antalya/etkinlik/33--uluslararasi-aspendos-opera-ve-bale-festivali-4 (individual performance record also states complete festival range in description) |
| Golden Orange | 24–31 October 2026 | https://antalyaff.com/tr and https://www.antalya.bel.tr/tr/haber-detay/63-altin-portakalda-biletler-satista |
| Kaleiçi Old Town Festival | 8–11 October 2026 | https://kaleicioldtown.com/en/about-the-festival (official page title identifies edition and dates) |

## January 2027 trade-fair additions

Two separate ANFAŞ fairs run on 12–15 January 2027 at ANFAŞ Expo Center in Aksu, with published 10:00–18:00 visiting hours:

- Hotel Equipment: https://anfashotelequipment.com/en/fair-profile
- Food Product: https://anfasfoodproduct.com/en/fair-profile

Both organizer visitor profiles exclude the general public. Free registration asks for company/contact information and a business-card photo; entry details are emailed nearer the fair. Food Product’s alcohol and bar-design zones are restricted to HoReCa professionals and authorised distributors, excluding under-18s. No event-wide minimum age was established. Exact sources and evidence are recorded in `docs/anfas-2027-sources.json`. No registration was submitted.

The Antalya Exclusive Jewellery Show was not added. Its organizer confirms 30 April–2 May 2027, but visitor eligibility and admission terms remain unverified.

## Withdrawn dates, retained URLs

- Antalya Piano Festival: removed estimated 26 November–12 December 2026 dates and unsupported free admission. The official apf.com.tr fetch timed out. Procurement listings are not a substitute for a confirmed public programme. Link to the municipal calendar pending verification.
- Pinhani: Biletix search index showed 13 November at 22:00, but a subsequent current page read did not return that listing. Do not label as confirmed until the specific current ticket page is verified.
- Altın Gün: earlier aggregator time conflicts with other listings. No confirmed primary page was established. Date and time withdrawn.
- Antalya Fest: prior third-party guide did not establish an organizer, current programme or venue. Dates withdrawn; municipal calendar link is explicitly an alternative resource, not supporting evidence.
- Avoid altinportakal.org.tr: during the review it redirected to an unrelated general site. Use antalyaff.com.

## Data contract

Each markdown entry has `source_url`, `source_name`, `last_checked` (quoted ISO date), `date_verified` (boolean), `verification_note`, and optional quoted ISO `start_date` / `end_date`. Missing end date means a single-day event. `time_display` is optional, local Antalya time. `admission_note` is optional and displays verified eligibility restrictions on listings and detail pages. Images are identified as illustrative destination scenery, not event photography.

Never fabricate a date for sorting. Only `date_verified: true` plus valid dates can produce current/upcoming/archive status. Awaiting listings keep their historic title-derived URL but publish no dates. Past editions never imply next year's dates.

## Build integration

`lib/events.js` re-exports the browser-safe shared implementation from `js/events.js`. Register Eleventy filters named `eventDate`, `eventStatus`, `eventStatusLabel`, `eventDateLabel`. Existing `events` and `eventCategories` collections can remain. Sort dated records by normalized ISO date and put undated records last; do not subtract invalid dates.

Templates directly load `/js/events.js`. Keep the existing JS passthrough and a global `[hidden] { display: none !important; }` rule. Filters stay hidden without JavaScript and all dated/undated records remain readable. With JavaScript, defaults show only current/upcoming records. Status refreshes on load, every minute and on tab visibility changes, using Europe/Istanbul rather than the visitor timezone. This automatically archives expired dates but does **not** detect organizer cancellations or schedule changes. Those still require editorial source review.

Date filters use interval overlap, so a multi-day event remains discoverable during the selected trip dates. Unknown dates do not match a date range. Invalid date ranges show a clear error. Search ignores Turkish/Latin diacritic differences. Reset restores the default active-event view.

Run `node --test tests/events.test.js` and the full Eleventy build after content changes. Verify official sources again before publication, particularly near-term performances.
