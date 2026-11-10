# Venue photo review and publication

An official website is a source, not a reuse licence. Public visibility and source credit alone do not establish permission. Missing records do not establish infringement; private permission may exist elsewhere.

## Owner decision (2026-11-09, reconfirmed 2026-11-10) — read this first

The site owner directed that each hotel's, restaurant's and golf club's **own website photos** be shown on that venue's listing, with credit and a link to the source page, and accepted responsibility for their use. This is recorded in `docs/photo-rights.json` → `owner_acceptance` (and the per-asset list `owner_accepted`). It is an owner decision, **not** a licence and not a claim that rights holders granted permission.

- Do **not** remove or quarantine these photos without the owner's explicit instruction.
- Exclusions still win (sister-property mix-ups, unreachable CDNs). Add an asset to `excluded` if it shows the wrong property or a rights holder asks for removal.
- Takedown: remove promptly on request from the venue or photographer (via /contact/), then add it to `excluded`.
- Photos the owner adds through the admin panel are covered by the same decision (`auto_accept_listed`).

## Earlier remediation (superseded by the owner decision above)

The 117 venue selections from main `22b3107` are retained in `docs/import/official-photo-pending.json`, outside the published site. Their 365 selected source references are not active front matter. Existing documented property archives and clearly labelled destination photographs fill the same hero and card components. Layout, CSS and venue prose are unchanged. Dated property images remain archival, with full framing and changes/credit notices. Destination pictures identify the actual subject and are not presented as the venue.

This review does not independently certify every historic licence or unrelated legacy asset. The editorial register, original source links and existing source-review records remain the evidence for those images.

## Approving a new asset

1. Verify the exact photograph and property identity. Obtain or locate an applicable licence or owner/photographer grant. Do not infer it from the venue name or filename.
2. Add an asset-specific entry to `docs/photo-rights.json` → `approved`. Required fields are `id`, `venue_slug`, `src`, `status: "approved"`, `author`, `alt`, `caption`, `width`, `height`, `license`, `license_url`, `source_url`, `evidence_url`, `changes`, `reviewed_by`, `reviewed_on` (YYYY-MM-DD), and `expires_on` (YYYY-MM-DD or explicit null for an indefinite term).
3. Document `permitted_use`: `commercial_editorial`, `web_display`, `resize_convert`, `responsive_crop` and `cdn_cache` must each be true for the current official-photo rendering path. If a grant disallows any of these, do not approve this path; prepare a compatible local asset and rendering path instead. A field does not create permission: an editor must verify the linked evidence actually grants these uses. Do not commit private agreements, personal data, credentials or private access links. If evidence cannot be linked publicly, keep the asset pending until a suitable review workflow is available.
4. Previously excluded venues/assets stay in `excluded` even if the candidate collector finds them again. Review the original identity/availability issue and record a resolution before changing an exclusion's status; do not delete its history.
5. Add only the exact approved URL to the venue's `photos_official`. The importer accepts only approved exact URLs and retains exclusions. It cannot revive pending choices.
6. Run `npm run validate`, `npm run test:e2e`, and `node scripts/sync-image-domains.js` before publication. Both normal builds and Eleventy serve run the rights gate. Updated official photos automatically appear in photography credits with their actual licence metadata.

The candidate collector may retain publicly found URLs for review. Candidate storage is not publication approval. Neither an upload nor an admin photo entry bypasses the build check.
