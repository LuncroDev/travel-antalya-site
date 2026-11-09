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
function approvedPhoto(slug, src, rights = registry(), now = today()) {
  if (isExcluded(slug, src, rights)) return null;
  const matches = (rights.approved || []).filter(p => p.venue_slug === slug && p.src === src);
  return matches.length === 1 && !approvalErrors(matches[0], now).length ? matches[0] : null;
}
function selectedOfficialPhotos(data = {}, rights = registry()) {
  return (Array.isArray(data.photos_official) ? data.photos_official : []).map(p => approvedPhoto(data.slug, p?.src, rights)).filter(Boolean).map(p => ({ ...p, contextual: false, official: true }));
}
module.exports = { registry, approvalErrors, isExcluded, approvedPhoto, selectedOfficialPhotos };
