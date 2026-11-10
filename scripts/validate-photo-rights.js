#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { registry, approvalErrors, approvedPhoto, isExcluded } = require('../lib/photo-rights');
const ROOT = path.resolve(__dirname, '..');
function validatePhotoRights(root = ROOT, rights = registry()) {
  const errors = [];
  if (!Array.isArray(rights.approved) || !Array.isArray(rights.excluded)) throw new Error('Invalid photo rights registry');
  const seen = new Set();
  for (const photo of rights.approved || []) {
    for (const error of approvalErrors(photo)) errors.push(`${photo.id || photo.src}: ${error}`);
    const key = `${photo.venue_slug}\n${photo.src}`;
    if (seen.has(key)) errors.push(`duplicate approval: ${photo.src}`);
    seen.add(key);
    if (isExcluded(photo.venue_slug, photo.src, rights)) errors.push(`approval conflicts with exclusion: ${photo.src}`);
  }
  let checked = 0;
  for (const rel of fs.readdirSync(path.join(root, 'content'), { recursive: true }).filter(f => f.endsWith('.md'))) {
    const data = matter(fs.readFileSync(path.join(root, 'content', rel), 'utf8')).data;
    if (data.photos_official !== undefined && !Array.isArray(data.photos_official)) { errors.push(`${rel}: photos_official must be an array`); continue; }
    for (const photo of data.photos_official || []) {
      checked++;
      if (!approvedPhoto(data.slug, photo?.src, rights, undefined, data)) errors.push(`${rel}: undocumented, expired or excluded photo ${photo?.src || '(missing URL)'}`);
    }
  }
  if (errors.length) throw new Error(`Photo rights check failed:\n${errors.join('\n')}\nUse the licensed library or record reviewed rights in docs/photo-rights.json.`);
  console.log(`Photo rights check: ${checked} selected official photos, all documented; ${rights.excluded.length} venue exclusions retained.`);
  return checked;
}
if (require.main === module) validatePhotoRights();
module.exports = validatePhotoRights;
