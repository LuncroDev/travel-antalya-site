(function(){
'use strict';
function normalize(value){return String(value||'').toLocaleLowerCase('tr').replace(/[ıİ]/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
if(typeof module!=='undefined')module.exports={normalize};
if(typeof document==='undefined')return;
for(const root of document.querySelectorAll('[data-venue-directory]')){
 const form=root.querySelector('[data-venue-filters]'),cards=[...root.querySelectorAll('[data-venue]')],count=root.querySelector('[data-venue-count]'),empty=root.querySelector('[data-venue-empty]');
 if(!form)continue;const q=form.elements.q,area=form.elements.area,category=form.elements.category;
 const params=new URLSearchParams(location.search);for(const el of [q,area,category])el.value=params.get(el.name)||'';
 function apply(update=true){let n=0;for(const card of cards){const match=normalize(card.textContent).includes(normalize(q.value.trim()))&&(!area.value||card.dataset.area===area.value)&&(!category.value||card.dataset.category===category.value);card.hidden=!match;if(match)n++;}count.textContent=`Showing ${n} of ${cards.length} profiles`;empty.hidden=n!==0;if(update){const url=new URL(location.href);for(const el of [q,area,category]){if(el.value)url.searchParams.set(el.name,el.value);else url.searchParams.delete(el.name);}history.replaceState(null,'',url);}}
 form.hidden=false;form.addEventListener('input',()=>apply());form.addEventListener('change',()=>apply());form.addEventListener('submit',e=>{e.preventDefault();apply();});form.addEventListener('reset',()=>setTimeout(()=>apply(),0));root.querySelector('[data-venue-reset]').addEventListener('click',()=>form.reset());apply(false);
}
})();
