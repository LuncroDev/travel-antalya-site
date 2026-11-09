'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { registry, approvalErrors, isExcluded } = require('../lib/photo-rights');
function validateBuiltPhotoRights(root = path.resolve(__dirname, '../_site'), rights = registry()) {
  const known = new Set(require('../_data/editorialPhotos.json').map(p => p.src));
  for (const p of rights.approved || []) if (!approvalErrors(p).length && !isExcluded(p.venue_slug,p.src,rights)) known.add(p.src);
  const errors=[];
  const decode=value=>value.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  for(const file of fs.readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.html')&&!f.startsWith('admin/'))) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const tag of html.matchAll(/<img\b[^>]*>/gi)) {
      const urls=[];
      for(const attr of tag[0].matchAll(/\b(src|srcset)="([^"]*)"/gi)) {
        if(attr[1].toLowerCase()==='src')urls.push(decode(attr[2]));
        else urls.push(...decode(attr[2]).split(',').map(v=>v.trim().split(/\s+/)[0]));
      }
      for(let src of urls) {
        if(src.startsWith('/.netlify/images?'))src=new URL(src,'https://travel-antalya.com').searchParams.get('url')||'';
        if(isExcluded(null,src,rights)||(/^https?:\/\//.test(src)&&!known.has(src)))errors.push(`${file}: image without current rights approval: ${src}`);
      }
    }
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Built photo rights check: no undocumented remote or excluded image embeds.');
}
if(require.main===module)validateBuiltPhotoRights();
module.exports=validateBuiltPhotoRights;
