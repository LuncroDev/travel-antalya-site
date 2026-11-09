# Travel Antalya — design system

The November 2026 redesign is modelled on the *structure* of
[miamiandbeaches.com](https://www.miamiandbeaches.com/) (Greater Miami CVB), rebuilt in Travel Antalya's own
brand. This file records what was measured on the Miami site, what we adopted, and the rules every new
page and every new piece of content must follow. Styles live in `css/site.css`; components in
`_includes/ui.njk`; menu content in `_data/nav.js`.

## 1. What Miami does (measured 9 Nov 2026, desktop 1440 px)

| Element | Miami value | Notes |
|---|---|---|
| Body / UI font | Futura PT, 16 px / 1.4 | Geometric sans |
| Display font | "Perfectly Nineties", weight 800 | Soft, chunky serif |
| H1 (page title) | 82 px / 1.1, plum | Sits **below** the hero photo, after a wave |
| H2 (section) | 60 px / 1.1, plum | Title case |
| Feature H3 | 48 px | Split blocks ("Miami Hotels") |
| Card title | 24 px / 1.2, blue, +0.02em | Coral underline + ↗ arrow |
| Eyebrow | 18 px bold uppercase, blue | Above every H2 |
| Subheading | 24 px uppercase regular | Under H1/H2 |
| Paragraph | 22 px / 1.4, #262626 | Large, few |
| Main nav | 25 px bold, blue | Active item = solid blue pill |
| Utility bar | 16 px on plum | "Visitors / Meeting Planners / Language" |
| Buttons | 18 px bold uppercase, pill (radius 800 px), 10×30 px padding | Solid blue |
| Footer links | 22 px bold on blue | Giant logo mark |
| Background | cream #FAF8F0 | |

Layout patterns:

- **Homepage**: 10,800 px tall, **178 images, ~1,000 words**. Text is the exception, photos are the rule.
- **Hero**: full-bleed video/photo, then a **wave** into the page colour; title sits under the wave.
- **Intro band**: a coloured band holding a white rounded card; long text is cut off after two
  paragraphs with a **READ MORE** link.
- **Guide pages** (e.g. Beaches): each H2 section has only **1–2 sentences** (30–40 words) full of links,
  followed by card grids. ~1,000 words, 50 images on a 10,500 px page.
- **Cards**: rounded photo (≈16–20 px radius), serif title in blue, ↗ arrow, coral rule, 2–3 lines of text.
- **Directory lists** (hotels): large rounded search pill, filter pills, white list cards with photo on
  the left, title, 2-line excerpt, category chip, price/badge, ↗ arrow, "Sponsored" ribbon.
- **Split feature**: photo with an organic (blob) edge + solid colour panel with title and pill button.
- **Mega menu**: big serif title left, uppercase category links with chevrons and coral rules,
  two photo feature cards on the right, social links.
- **Footer**: wave top, solid brand colour, huge logo, newsletter + contact pills, bold links.

## 2. Our translation

| Token | Value |
|---|---|
| Blue (logo) | `--blue #0077B8` — links, card titles, buttons, nav |
| Deep blue | `--blue-deep #0B3A5C` — all headings |
| Navy | `--navy #072B44` — top bar, footer |
| Orange (palm trunk) | `--orange #F15921` — eyebrows, arrows, rules, primary CTA |
| Sea band | `--sea #4B9BCB` — intro band |
| Sand | `--sand #FBF6EE` — alternate sections, directory ground |
| Ground | white (owner's request) |
| Display font | **Fraunces 700** (self-hosted) ≈ Perfectly Nineties |
| Text font | **Jost** 400/500/700 (self-hosted) ≈ Futura PT |

Type scale (fluid, desktop → mobile): hero 96→48, H1 82→44, H2 60→36, feature H3 40→28, card title 24→22,
lead 24→20, body 19, eyebrow 17 (bold, uppercase, +0.08em, orange), nav 20 bold, buttons 17 bold uppercase pill.
This is ≈1.25× the previous site, as requested.

## 3. Rules for every page

1. **Photo first.** Every section needs an image or a card grid. No section may be text-only except
   legal pages and the article body.
2. **Text budget.** Hero: H1 + one subhead line. Section intro: max 2 sentences (≈40 words). Longer
   copy goes into the intro card (it collapses behind *Read more*) or into a *Good to know* accordion.
3. **Caveats are collapsed, not deleted.** Source dates, booking caveats and "not a live price" notes stay
   for honesty and AdSense, but inside the side card or a `<details>` accordion.
4. **One H1 per page**, eyebrow above every H2, ↗ arrow on every card title.
5. **Images** go through `pic()` so they get optimized WebP (`images/opt/*-640/1280.webp`), width/height,
   `srcset` and lazy loading. Only the hero uses `eager` + `fetchpriority="high"`.
6. **Never pass off an area photo as the venue.** If an item has no photo of its own, `cardPhoto` uses
   a photo of the surrounding district and the card shows the *Area photo* chip. Property photos are
   dated archive photos and say so.
7. **Credit every Creative Commons photo** with `credit()` (the © button) and in the gallery.
8. **Icons**: line icons from `icon()` in `ui.njk` (24 px grid, 1.8 stroke). Add new ones there.

## 4. Components (`_includes/ui.njk`)

| Macro | Use |
|---|---|
| `pageHero(photo, eyebrow, title, sub, crumbs)` | Listing/landing pages |
| `introCard` markup (`.intro-band > .intro-card[data-readmore]`) | 2–4 paragraphs that collapse |
| `sectionHead(eyebrow, title, href, linkText, id)` | Every section header |
| `card(href, photo, title, text, eyebrow, badge, meta, sizes)` | Grids (4/3/2 columns) |
| `rowCard(href, photo, title, text, chips, badge, attrs, side)` | Filterable directories |
| `.split` (+ `split-orange`, `split-navy`, `reverse`) | Big feature blocks |
| `.tile` | Destination tiles with title overlay |
| `.scroller[data-scroller]` | Horizontal carousels with arrow buttons |
| `.detail-gallery`, `.facts`, `.side-card`, `.good-to-know` | Detail pages |

## 5. Speed

- Fonts self-hosted (`/fonts`, ~90 KB total, `font-display: swap`, two preloaded).
- One stylesheet, one small script; Netlify Identity only loads for CMS invite links.
- Photos: run `python3 scripts/optimize-images.py` after adding any image. Originals stay as the source.
