const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const matter=require('gray-matter');const records=kind=>fs.readdirSync(`content/${kind}`).filter(f=>f.endsWith('.md')).map(f=>matter(fs.readFileSync(`content/${kind}/${f}`,'utf8')).data);const hotels=records('hotels'),events=records('events');const {eventStatus}=require('../lib/events');const active=events.filter(e=>['current','upcoming'].includes(eventStatus(e,'2026-11-09'))).length;
const load=async(page,script,query='')=>{
 const dom=new JSDOM(fs.readFileSync(`_site/${page}/index.html`,'utf8'),{url:`https://travel-antalya.com/${page}/${query}`,runScripts:'outside-only'});
 if(script==='events'){const NativeDate=dom.window.Date;dom.window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-11-09T12:00:00Z']));}static now(){return Date.parse('2026-11-09T12:00:00Z');}};}
 dom.window.eval(fs.readFileSync(`js/${script}.js`,'utf8'));
 await new Promise(r=>setTimeout(r,0));return dom;
};
const visible=(doc,selector)=>[...doc.querySelectorAll(selector)].filter(el=>!el.hidden);
const change=(window,selector,value)=>{const el=window.document.querySelector(selector);el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));el.dispatchEvent(new window.Event('change',{bubbles:true}));};
test('hotel URL filters, combined filters, empty state and reset',async()=>{
 const dom=await load('hotels','hotels','?q=Belek'),w=dom.window,d=w.document;
 assert.equal(d.querySelector('#hotel-search').value,'Belek');assert.ok(visible(d,'[data-hotel]').length>0);
 change(w,'#hotel-search','');change(w,'#hotel-area','Belek');change(w,'#hotel-type','Golf resort');assert.equal(visible(d,'[data-hotel]').length,hotels.filter(h=>h.neighborhood==='Belek'&&h.category==='Golf resort').length);
 change(w,'#hotel-search','missing-hotel-123');assert.equal(visible(d,'[data-hotel]').length,0);assert.equal(d.querySelector('#hotel-empty').hidden,false);
 d.querySelector('#hotel-reset-empty').click();await new Promise(r=>setTimeout(r,5));assert.equal(visible(d,'[data-hotel]').length,hotels.length);
 change(w,'#hotel-search','kaleici');assert.equal(visible(d,'[data-hotel]').length,hotels.filter(h=>h.neighborhood==='Kaleiçi').length);dom.window.close();
});
test('global search deep link, type, safe text and reset',async()=>{
 const dom=await load('search','search','?q=kas&type=District'),w=dom.window,d=w.document;
 assert.equal(visible(d,'[data-search-item]').length,1);assert.match(visible(d,'[data-search-item]')[0].textContent,/Kaş/);
 change(w,'#guide-query','<img src=x onerror=alert(1)>');assert.equal(visible(d,'[data-search-item]').length,0);assert.equal(d.querySelector('#search-empty').hidden,false);assert.equal(d.querySelector('#search-count img'),null);
 d.querySelector('form').reset();await new Promise(r=>setTimeout(r,5));assert.ok(visible(d,'[data-search-item]').length>60);dom.window.close();
});
test('event active, archive, awaiting, invalid range and reset',async()=>{
 const dom=await load('events','events'),w=dom.window,d=w.document;
 assert.equal(visible(d,'[data-event]').length,active);
 change(w,'select[name=period]','archive');assert.equal(visible(d,'[data-event]').length,3);
 change(w,'select[name=period]','awaiting');assert.equal(visible(d,'[data-event]').length,4);
 d.querySelector('form').reset();await new Promise(r=>setTimeout(r,5));assert.equal(visible(d,'[data-event]').length,active);
 change(w,'input[name=from]','2027-05-01');assert.equal(visible(d,'[data-event]').length,0);assert.equal(d.querySelector('[data-event-empty]').hidden,false);dom.window.close();
});
test('mobile menu opens, closes repeatedly and escapes accessibly',()=>{
 const dom=new JSDOM(fs.readFileSync('_site/index.html','utf8'),{url:'https://travel-antalya.com/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.matchMedia=()=>({addEventListener(){}});w.eval(fs.readFileSync('js/site.js','utf8'));
 const menu=d.querySelector('.mobile-menu-toggle');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'false');menu.click();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(menu.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,menu);dom.window.close();
});

test('restaurant and golf filters keep working after reset',async()=>{
 for(const page of ['restaurants','golf']){const dom=await load(page,'venues'),w=dom.window,d=w.document;const total=d.querySelectorAll('[data-venue]').length;assert.ok(total>0);change(w,'input[name=q]','does-not-exist-123');assert.equal(visible(d,'[data-venue]').length,0);assert.equal(d.querySelector('[data-venue-empty]').hidden,false);d.querySelector('[data-venue-reset]').click();await new Promise(r=>setTimeout(r,5));assert.equal(visible(d,'[data-venue]').length,total);dom.window.close();}
});

test('trade-fair filters preserve two date ranges and visible admission conditions',async()=>{
 const dom=await load('events','events'),w=dom.window,d=w.document;
 change(w,'select[name=category]','Trade fairs');change(w,'input[name=from]','2027-01-15');change(w,'input[name=to]','2027-01-15');
 const fairs=visible(d,'[data-event]');assert.equal(fairs.length,2);for(const item of fairs)assert.match(item.querySelector('.event-admission-note').textContent,/not open to the general public/);
 change(w,'input[name=to]','2027-01-16');change(w,'input[name=from]','2027-01-16');assert.equal(visible(d,'[data-event]').length,0);
 dom.window.close();
 const category=new JSDOM(fs.readFileSync('_site/events/category/trade-fairs/index.html','utf8'));
 assert.equal(category.window.document.querySelectorAll('[data-event]').length,2);assert.equal(category.window.document.querySelectorAll('img[src=""]').length,0);
 for(const slug of ['anfas-hotel-equipment-2027','anfas-food-product-2027']){const html=fs.readFileSync('_site/events/'+slug+'/index.html','utf8');assert.match(html,/event-admission-note/);assert.match(html,/not open to the general public/);}
 category.window.close();
});
