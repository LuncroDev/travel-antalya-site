const fs=require('node:fs'),path=require('node:path'),matter=require('gray-matter');
const {eventDate,eventStatus,todayInAntalya}=require('../lib/events');
const today=todayInAntalya(), report={reviewedAt:today,hotels:0,events:{},needsReview:[]};
for(const collection of ['hotels','events']) for(const name of fs.readdirSync(`content/${collection}`).filter(n=>n.endsWith('.md'))){
 const data=matter(fs.readFileSync(path.join('content',collection,name),'utf8')).data;
 const reviewed=eventDate(data.last_checked);const age=reviewed ? (Date.parse(today)-Date.parse(reviewed))/86400000 : Infinity;
 if(collection==='hotels')report.hotels++;else{const status=eventStatus(data,today);report.events[status]=(report.events[status]||0)+1;}
 const threshold=collection==='events'?7:90;
 if(age>threshold)report.needsReview.push({file:`content/${collection}/${name}`,reason:reviewed?`Source last reviewed ${age} days ago`:'Missing review date'});
}
console.log(JSON.stringify(report,null,2));
// This report never changes records or claims that a source was checked automatically.
