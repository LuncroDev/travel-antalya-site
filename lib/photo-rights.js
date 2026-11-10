'use strict';
// Asset-specific editorial approval, not a claim that an accessible source is licensed.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const registry = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/photo-rights.json'), 'utf8'));
const https = value => typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value);
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const today = () => new Date().toISOString().slice(0, 10);
function approvalErrors(record, now = today()) {
  if (!record) return ['no asset-specific approval'];
  const errors = [];
  for (const field of ['id', 'venue_slug', 'author', 'alt', 'caption', 'license', 'changes', 'reviewed_by']) {
    if (typeof record[field] !== 'string' || !record[field].trim()) errors.push(`missing ${field}`);
  }
  if (!https(record.src) && !/^\/images\/[^\s]+$/.test(record.src || '')) errors.push('invalid asset URL');
  for (const field of ['source_url', 'license_url', 'evidence_url']) if (!https(record[field])) errors.push(`missing ${field}`);
  if (/^official (website|site)$/i.test(record.license || '')) errors.push('a source label is not a licence');
  if (record.status !== 'approved') errors.push('not approved');
  if (!date(record.reviewed_on) || record.reviewed_on > now) errors.push('invalid review date');
  if (!Object.hasOwn(record, 'expires_on') || (record.expires_on !== null && (!date(record.expires_on) || record.expires_on < now))) errors.push('missing or expired term');
  if (!(record.width > 0 && record.height > 0)) errors.push('missing image dimensions');
  for (const permission of ['commercial_editorial', 'web_display', 'resize_convert', 'responsive_crop', 'cdn_cache']) {
    if (record.permitted_use?.[permission] !== true) errors.push(`unverified permission: ${permission}`);
  }
  return errors;
}
function isExcluded(slug, src, rights = registry()) {
  return (rights.excluded || []).some(e => e.status === 'excluded' && (e.venue_slug === slug || (e.images || []).includes(src)));
}
// Site-owner acceptance: the owner directed that each venue's own website photos
// be shown with credit and accepted responsibility for their use. This is recorded
// as a decision, never as a licence, and exclusions still win.
function ownerAccepted(slug, src, rights = registry(), data = null) {
  const policy = rights.owner_acceptance;
  if (!policy || policy.status !== 'accepted' || !src) return null;
  let rec = (rights.owner_accepted || []).find(p => p.venue_slug === slug && p.src === src);
  // Photos the owner adds to a venue later (admin panel) fall under the same decision.
  if (!rec && policy.auto_accept_listed && data && (data.photos_official || []).some(p => p && p.src === src)
      && (/^https:\/\/[^\s]+$/.test(src) || /^\/images\/uploads\/[^\s]+$/.test(src))) {
    rec = { venue_slug: slug, venue_title: data.title, src, source_page: data.photo_source || data.official_url || (src.startsWith('http') ? src : 'https://travel-antalya.com/'), accepted_on: null };
  }
  if (!rec) return null;
  const name = rec.venue_title || slug;
  return { id: `${slug}-site-${(rights.owner_accepted || []).indexOf(rec)}`, venue_slug: slug, src, status: 'owner-accepted',
    author: `${name} — official website`, alt: rec.alt || `${name}, photo from the venue's website`, caption: rec.caption || name,
    license: 'Venue photo shown with credit at the site owner’s direction (not a licence)', license_url: null,
    source_url: rec.source_page, changes: 'Resized and responsively cropped via Netlify Image CDN.', width: 1280, height: 853,
    basis: 'owner_acceptance', accepted_on: rec.accepted_on };
}
function approvedPhoto(slug, src, rights = registry(), now = today(), data = null) {
  if (isExcluded(slug, src, rights)) return null;
  const matches = (rights.approved || []).filter(p => p.venue_slug === slug && p.src === src);
  if (matches.length === 1 && !approvalErrors(matches[0], now).length) return matches[0];
  return ownerAccepted(slug, src, rights, data);
}
function selectedOfficialPhotos(data = {}, rights = registry()) {
  return (Array.isArray(data.photos_official) ? data.photos_official : []).map(p => approvedPhoto(data.slug, p?.src, rights, today(), data)).filter(Boolean).map(p => ({ ...p, contextual: false, official: true }));
}
module.exports = { registry, approvalErrors, isExcluded, approvedPhoto, ownerAccepted, selectedOfficialPhotos };
