# Daily content guide (for the Travel Antalya content bot)

This file is the brief for the automated daily run and for anyone adding content by hand
("research X and add it"). Read `DESIGN.md` for how pages look; this file says **what to write and how**.
The site is English-language. Today's date and Antalya time (Europe/Istanbul) apply to every date check.

## 1. Daily quota — 10 new items

| # | Type | Folder | Notes |
|---|---|---|---|
| 2 | Hotels | `content/hotels/` | Properties not yet in the folder (check by name and slug). |
| 2 | Restaurants | `content/restaurants/` | Real, currently operating venues with an official page or listing. |
| 2 | Events | `content/events/` | Only upcoming events with a date confirmed on the organiser/ticket page. |
| 1 | Things to do / trips | `content/things-to-do/` | Attractions, beaches, ruins, canyons, boat trips, day trips. |
| 1 | Golf | `content/golf/` or a golf blog post | When all clubs are covered, write a golf guide post instead. |
| 2 | Blog guides | `content/blog/` | Long-form SEO guides (see §4). Pick from `docs/content-queue.md`. |

If a category has nothing genuinely new and verifiable today, write an extra blog guide instead.
**Never pad the count with invented or thin entries.**

## 2. Hard rules (AdSense + honesty)

1. **No invented facts.** Every name, address, date, price, award or facility must come from a source you
   opened today. Put that URL in `source_url`/`source_urls` and today's date in `last_checked`.
2. **No fake reviews, ratings, quotes, prices or "we stayed here" claims.** We are an editorial guide.
3. **No copied text.** Write in your own words; never paste paragraphs from hotel sites, TripAdvisor, etc.
4. **Events:** set `date_verified: true` only when the exact day/month/year is on the primary page.
   Never roll last year's festival forward.
5. **Michelin:** the 2026 MICHELIN Guide Türkiye does not cover Antalya — never call a venue starred/selected.
6. **Photos:** only use photos you can license (Wikimedia Commons CC BY / CC BY-SA, Pexels, Unsplash, or
   photos the owner supplied). Add each to `_data/editorialPhotos.json` with author, licence, licence URL,
   source URL, caption, `kind` (`property` or `destination`), `district_slug`, and for properties
   `property_slug`. Save the file under `images/editorial/` and run `python3 scripts/optimize-images.py`.
   If image downloads are blocked, add no photo — the site automatically shows a labelled area photo.
7. **Never** label a district photo as the venue. Never use AI-generated images as real places.

## 3. Front matter templates

Slugs are lowercase ASCII with hyphens (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u). Keep `excerpt` ≤ 160 characters.

**Hotel**
```yaml
---
title: "Hotel Name"
slug: "hotel-name"
tagline: "One sentence on where it is and who it suits."
category: "Coastal resort"   # City hotel | Boutique & heritage | Coastal resort | Golf resort
neighborhood: "Belek"        # Antalya city | Kaleiçi | Konyaaltı | Lara & Kundu | Belek | Kemer | Side | Alanya | Kaş | Kalkan
district_slug: "serik"       # see _data/destinations.json
official_url: "https://..."
source_url: "https://..."
source_label: "Official hotel or hotel-group website"
source_urls: ["https://..."]
last_checked: "YYYY-MM-DD"
excerpt: "≤160 characters."
booking_note: "One specific thing to check before booking."
---
```
Body: 350–600 words. Sections (H2): *Where it is*, *The setting* (beach/pool/grounds as published),
*Rooms & dining* (only what the official site lists), *Who it suits*, *Getting there* (airport distance
if published), *What to check for this stay*.

**Restaurant** — same keys as the hotel minus `category` values; use a cuisine `category`
(e.g. "Seafood and meze"), a precise `neighborhood` (e.g. "Kaleiçi / Mescit Sokak"), and add
`michelin_note: "No verified Michelin distinction for this Antalya venue in the 2026 selection."`.
Body 300–500 words: *The food*, *The setting*, *When to go*, *Booking*.

**Event** — copy the keys of an existing file in `content/events/` (`start_date`, optional `end_date`,
`date_verified`, `venue`, `district_slug`, `neighborhood`, `category`, `time_display`, `ticket_url`,
`source_name`, `verification_note`). Categories: Concerts, Theatre, Comedy, Festivals, Family,
Sports, Cultural, Nightlife, Conferences, Ballet & music. Body 200–350 words.

**Things to do**
```yaml
---
title: "Place Name"
category: "Ancient Ruins"    # Ancient Ruins | Nature | Beaches | Adventure | Old Town | Museums | Parks & Gardens | Tours
tagline: "Short line."
map_lat: 36.88
map_lng: 30.70
excerpt: "≤160 characters."
district_slug: "muratpasa"
photo_id: "editorial-photo-id"   # optional
photo_exact: true                # false if the photo shows the area, not the place
featured: false
---
```
Body 500–900 words: what it is, highlights, how to get there, best time, tickets/opening (link the
official page, don't guess prices), tips, what's nearby (link other pages).

**Golf** — copy `content/golf/antalya-golf-club.md` keys; `category: "Golf club"`.

**Blog**
```yaml
---
title: "Keyword-led title (≤ 65 characters)"
slug: "keyword-led-slug"
date: YYYY-MM-DDT09:00:00+03:00
date_display: "Month D, YYYY"
category: "Beaches"     # Beaches | Weather | Hotels | Food | Golf | Itineraries | History | Practical
excerpt: "≤160 characters, includes the main keyword."
photo_id: "editorial-photo-id"
---
```

## 4. Writing style

- Voice: warm, confident, specific — like a well-travelled friend. Short sentences. No filler
  ("nestled", "hidden gem", "a feast for the senses", "whether you're… or…").
- SEO: one main keyword in title, slug, first paragraph and one H2; 2–4 related keywords naturally.
  Use H2/H3 headings every 150–250 words, lists for practical info, and a short FAQ (3–4 questions)
  at the end of blog guides.
- **Internal links:** every item links to 3+ existing pages (district, hotels area filter, related
  things to do, events). Use relative URLs like `/things-to-do/aspendos-theatre/`.
- External links: official sources only.
- Blog guides: 1,200–2,000 words.

## 5. Daily procedure

1. `git pull`, `npm ci`.
2. Read `docs/content-queue.md`; list existing slugs in each folder to avoid duplicates.
3. Research each item (official sites, municipality, ticketing pages, GoTürkiye). Write files.
4. Photos: §2.6. Then `python3 scripts/optimize-images.py`.
5. Move used topics in `docs/content-queue.md` to *Done* with the date; add 5+ new ideas.
6. `npm run validate` — must pass. Fix, never skip.
7. One commit: `content: YYYY-MM-DD — N items (hotels: …, events: …)`; push to `main` (one deploy).
8. Report what was added, with links, and anything skipped and why.

## Venue photos

The site owner has decided that venue listings use photos from the venue's **own official website**, credited and linked (see `docs/photo-rights-policy.md` → Owner decision). Add up to 4 such image URLs to `photos_official` plus `photo_source`, and record each in `docs/photo-rights.json` → `owner_accepted`. Never use a sister property's photos, stock images, AI images, or photos from booking/review sites. Excluded assets stay excluded. Do not remove existing venue photos unless the owner asks.
