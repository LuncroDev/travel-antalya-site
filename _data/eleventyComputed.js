const { absoluteUrl, publicUrl } = require('../lib/content');
const entity = data => data.hotel || data.event || data.thing || data.restaurant || data.r || data.post;
module.exports = {
  pageTitle: data => entity(data)?.data.title || data.cat?.name && `${data.cat.name} events in Antalya` || data.destination?.name && `${data.destination.name} travel guide` || data.pageTitle || 'Travel Antalya',
  pageDescription: data => entity(data)?.data.excerpt || data.cat?.name && `Explore sourced ${data.cat.name.toLowerCase()} listings, upcoming dates and past editions in Antalya.` || data.destination?.description || data.pageDescription || 'An independent guide to Antalya and its coast.',
  pageUrl: data => publicUrl(data.page.url),
  ogImage: data => absoluteUrl(entity(data)?.data.cover || data.cat?.events?.[0]?.data.cover || data.ogImage),
  resolvedSchema: data => {
    const item = entity(data)?.data;
    if (!item) return data.schema ? JSON.parse(JSON.stringify(data.schema)) : null;
    // Omit Event rich results until time, admission and structured venue fields are fully maintained.
    if (data.event) return null;
    const schema = { '@context': 'https://schema.org', '@type': data.hotel ? 'Hotel' : (data.restaurant || data.r) ? 'Restaurant' : data.thing ? 'TouristAttraction' : 'BlogPosting', name: item.title, description: item.excerpt, url: absoluteUrl(publicUrl(data.page.url)) };
    if (item.cover) schema.image = absoluteUrl(item.cover);
    if (data.post) { schema.headline = item.title; schema.datePublished = item.date; schema.author = { '@type': 'Organization', name: 'Travel Antalya' }; }
    return schema;
  }
};
