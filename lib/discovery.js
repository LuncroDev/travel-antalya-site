'use strict';
const districtByArea={
 'Antalya city':'muratpasa','Kaleiçi':'muratpasa','Konyaaltı':'konyaalti','Lara & Kundu':'aksu',
 'Belek':'serik','Kemer':'kemer','Side':'manavgat','Alanya':'alanya','Kaş':'kas','Kalkan':'kas'
};
function districtFor(item={}) { return item.district_slug || districtByArea[item.neighborhood] || ''; }
function relatedItems(items,item,count=3) {
 const district=districtFor(item);
 return (items||[]).filter(x=>x.data.title!==item.title).map(x=>({item:x,score:(district&&districtFor(x.data)===district?4:0)+(x.data.neighborhood===item.neighborhood?2:0)+(x.data.category===item.category?1:0)})).sort((a,b)=>b.score-a.score||a.item.data.title.localeCompare(b.item.data.title)).slice(0,count).map(x=>x.item);
}
function photoGallery(item={},library=[]) {
 const own=(item.gallery||[]).filter(p=>p.src&&p.source_url&&p.license&&p.alt);
 if(own.length) return own;
 const district=districtFor(item), area=item.neighborhood;
 const photos=(Array.isArray(library)?library:library.photos||[]).filter(p=>p.src&&p.source_url&&p.license&&p.alt);
 const property=photos.filter(p=>p.kind==='property'&&item.slug&&(p.property_slug===item.slug||(p.property_slugs||[]).includes(item.slug))).map(p=>({...p,contextual:false}));
 const surrounding=photos.filter(p=>p.kind==='destination'&&((district&&p.district_slug===district)||(area&&p.area===area))).slice(0,4).map(p=>({...p,contextual:true}));
 return [...property,...surrounding];
}
function hotelAreaFor(item={}) {
 const area=item.neighborhood||'';
 if(Object.hasOwn(districtByArea,area))return area;
 if(area.includes('Kaleiçi'))return 'Kaleiçi';
 if(area.includes('Kalkan'))return 'Kalkan';
 return {muratpasa:'Antalya city',konyaalti:'Konyaaltı',aksu:'Lara & Kundu',serik:'Belek',kemer:'Kemer',manavgat:'Side',alanya:'Alanya',kas:'Kaş'}[districtFor(item)]||'';
}
function photoById(photos,id){return (Array.isArray(photos)?photos:photos?.photos||[]).find(p=>p.id===id)||null;}
function uniqueValues(items,field){return [...new Set((items||[]).map(i=>i.data[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
module.exports={hotelAreaFor,districtFor,relatedItems,photoGallery,photoById,uniqueValues};
