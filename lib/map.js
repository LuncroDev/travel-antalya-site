'use strict';
// Builds the data behind /map/ and the homepage map. Exact pins come only from
// real map_lat / map_lng front matter. Hotels, restaurants and golf clubs are
// grouped into numbered AREA pins (area centre, not the building) so nothing
// is placed at a wrong address.

const DISTRICTS = {
  muratpasa: [36.8841, 30.7056], konyaalti: [36.8690, 30.6270], kepez: [36.9490, 30.7140],
  aksu: [36.9350, 30.8500], dosemealti: [37.0200, 30.5900], serik: [36.9170, 31.1000],
  manavgat: [36.7870, 31.4430], alanya: [36.5440, 31.9990], gazipasa: [36.2700, 32.3160],
  kemer: [36.5970, 30.5600], kumluca: [36.3700, 30.2870], finike: [36.2970, 30.1460],
  demre: [36.2450, 29.9850], kas: [36.2020, 29.6410], elmali: [36.7380, 29.9120],
  korkuteli: [37.0650, 30.1980], akseki: [37.0470, 31.7890], ibradi: [37.0990, 31.5970],
  gundogmus: [36.8140, 32.0980]
};

// Order matters: specific towns first.
const AREAS = [
  { id: 'alanya', label: 'Alanya', ll: [36.5440, 31.9990], words: ['alanya', 'şekerhane'] },
  { id: 'kalkan', label: 'Kalkan', ll: [36.2650, 29.4140], words: ['kalkan'] },
  { id: 'kas', label: 'Kaş', ll: [36.2020, 29.6410], words: ['kaş', 'kas ', 'andifli', 'çukurbağ'] },
  { id: 'side', label: 'Side', ll: [36.7670, 31.3890], words: ['side'] },
  { id: 'belek', label: 'Belek', ll: [36.8620, 31.0560], words: ['belek', 'kadriye', 'denizyaka', 'üçkum', 'acısu'] },
  { id: 'kemer', label: 'Kemer', ll: [36.5970, 30.5600], words: ['kemer'] },
  { id: 'konyaalti', label: 'Konyaaltı', ll: [36.8650, 30.6350], words: ['konyaaltı', 'liman'] },
  { id: 'kepez', label: 'Kepez', ll: [36.9490, 30.7140], words: ['kepez'] },
  { id: 'kaleici', label: 'Kaleiçi (Old Town)', ll: [36.8856, 30.7058], words: ['kaleiçi', 'kalekapısı', 'tuzcular', 'tophane'] },
  { id: 'lara', label: 'Lara & Kundu', ll: [36.8570, 30.8000], words: ['lara', 'kundu', 'çağlayan', 'şirinyalı', 'akra'] },
  { id: 'manavgat', label: 'Manavgat', ll: [36.7870, 31.4430], words: ['manavgat'] },
  { id: 'city', label: 'Antalya city centre', ll: [36.8969, 30.7133], words: ['antalya city', 'meltem'] }
];

function areaFor(data) {
  const text = `${data.neighborhood || ''}`.toLowerCase();
  for (const a of AREAS) if (a.words.some(w => text.includes(w))) return a;
  const d = DISTRICTS[String(data.district_slug || '').replace(/"/g, '')];
  if (d) {
    const near = AREAS.find(a => a.id === String(data.district_slug)) ;
    return near || { id: 'd-' + data.district_slug, label: data.district_slug.charAt(0).toUpperCase() + data.district_slug.slice(1), ll: d, words: [] };
  }
  return AREAS.find(a => a.id === 'city');
}

const num = v => (typeof v === 'number' && isFinite(v) ? v : (v !== undefined && v !== null && v !== '' && isFinite(Number(v)) ? Number(v) : null));
const featured = d => d.sponsored === true || d.sponsored === 'true';

function mapPoints(collections) {
  const groups = [
    ['hotel', collections.hotels || [], 'Hotel'],
    ['restaurant', collections.restaurants || [], 'Restaurant'],
    ['golf', collections.golf || [], 'Golf'],
    ['thing', collections.thingsToDo || [], 'Things to do']
  ];
  const areas = new Map();
  const places = [];
  for (const [type, items] of groups) {
    for (const it of items) {
      const d = it.data;
      const lat = num(d.map_lat), lng = num(d.map_lng);
      const sp = featured(d);
      const label = sp ? (d.sponsor_label || 'Featured') : '';
      if (type !== 'thing') {
        const a = areaFor(d);
        if (!areas.has(a.id)) areas.set(a.id, { id: a.id, label: a.label, lat: a.ll[0], lng: a.ll[1], counts: { hotel: 0, restaurant: 0, golf: 0 }, featured: [], hotelArea: '' });
        const rec = areas.get(a.id);
        rec.counts[type]++;
        if (type === 'hotel' && d.neighborhood && !rec.hotelArea) rec.hotelArea = d.neighborhood;
        if (sp) rec.featured.push({ title: d.title, url: it.url, type, label });
      }
      if (lat !== null && lng !== null && (type === 'thing' || sp)) {
        places.push({
          title: d.title, url: it.url, type: type === 'thing' && d.category === 'Beaches' ? 'beach' : type,
          cat: d.category || '', lat, lng, sponsored: sp, label
        });
      }
    }
  }
  const list = [...areas.values()].sort((a, b) => (b.counts.hotel + b.counts.restaurant + b.counts.golf) - (a.counts.hotel + a.counts.restaurant + a.counts.golf));
  list.forEach((a, i) => { a.n = i + 1; });
  const featuredAll = [];
  for (const [type, items] of groups) for (const it of items) if (featured(it.data)) featuredAll.push({ title: it.data.title, url: it.url, type, area: type === 'thing' ? '' : areaFor(it.data).label, label: it.data.sponsor_label || 'Featured' });
  return { areas: list, places, featured: featuredAll };
}

module.exports = { mapPoints, areaFor };
