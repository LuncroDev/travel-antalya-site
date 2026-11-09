const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
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
 change(w,'#hotel-search','');change(w,'#hotel-area','Belek');change(w,'#hotel-type','Golf resort');assert.equal(visible(d,'[data-hotel]').length,4);
 change(w,'#hotel-search','missing-hotel-123');assert.equal(visible(d,'[data-hotel]').length,0);assert.equal(d.querySelector('#hotel-empty').hidden,false);
 d.querySelector('#hotel-reset-empty').click();await new Promise(r=>setTimeout(r,5));assert.equal(visible(d,'[data-hotel]').length,28);
 change(w,'#hotel-search','kaleici');assert.equal(visible(d,'[data-hotel]').length,3);dom.window.close();
});
test('global search deep link, type, safe text and reset',async()=>{
 const dom=await load('search','search','?q=kas&type=District'),w=dom.window,d=w.document;
 assert.equal(visible(d,'[data-search-item]').length,1);assert.match(visible(d,'[data-search-item]')[0].textContent,/Kaş/);
 change(w,'#guide-query','<img src=x onerror=alert(1)>');assert.equal(visible(d,'[data-search-item]').length,0);assert.equal(d.querySelector('#search-empty').hidden,false);assert.equal(d.querySelector('#search-count img'),null);
 d.querySelector('form').reset();await new Promise(r=>setTimeout(r,5));assert.ok(visible(d,'[data-search-item]').length>60);dom.window.close();
});
test('event active, archive, awaiting, invalid range and reset',async()=>{
 const dom=await load('events','events'),w=dom.window,d=w.document;
 assert.equal(visible(d,'[data-event]').length,5);
 change(w,'select[name=period]','archive');assert.equal(visible(d,'[data-event]').length,3);
 change(w,'select[name=period]','awaiting');assert.equal(visible(d,'[data-event]').length,4);
 d.querySelector('form').reset();await new Promise(r=>setTimeout(r,5));assert.equal(visible(d,'[data-event]').length,5);
 change(w,'input[name=from]','2027-05-01');assert.equal(visible(d,'[data-event]').length,0);assert.equal(d.querySelector('[data-event-empty]').hidden,false);dom.window.close();
});
test('mobile menu opens, closes repeatedly and escapes accessibly',()=>{
 const dom=new JSDOM(fs.readFileSync('_site/index.html','utf8'),{url:'https://travel-antalya.com/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.matchMedia=()=>({addEventListener(){}});w.eval(fs.readFileSync('js/site.js','utf8'));
 const menu=d.querySelector('.mobile-menu-toggle');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'false');menu.click();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(menu.getAttribute('aria-expanded'),'false');assert.equal(d.activeElement,menu);dom.window.close();
});
