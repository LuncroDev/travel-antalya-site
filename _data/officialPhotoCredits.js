const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { selectedOfficialPhotos } = require('../lib/photo-rights');
module.exports = () => {
  const content = path.resolve(__dirname, '../content');
  const photos = new Map();
  for (const file of fs.readdirSync(content, { recursive: true }).filter(f => f.endsWith('.md'))) {
    for (const p of selectedOfficialPhotos(matter(fs.readFileSync(path.join(content, file), 'utf8')).data)) photos.set(p.id, p);
  }
  return [...photos.values()];
};
