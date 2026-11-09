// Field definitions for the Travel Antalya admin. Fields not listed here are
// kept untouched when an entry is saved.
(function (root) {
  const AREAS = ['Antalya city', 'Kaleiçi', 'Konyaaltı', 'Lara & Kundu', 'Belek', 'Kemer', 'Side', 'Manavgat', 'Alanya', 'Kaş', 'Kalkan'];
  const DISTRICTS = ['muratpasa', 'konyaalti', 'kepez', 'aksu', 'dosemealti', 'serik', 'manavgat', 'alanya', 'gazipasa', 'kemer', 'kumluca', 'finike', 'demre', 'kas', 'elmali', 'korkuteli', 'akseki', 'ibradi', 'gundogmus'];
  const source = [
    { name: 'official_url', label: 'Official website', type: 'url' },
    { name: 'source_url', label: 'Source used for facts', type: 'url' },
    { name: 'last_checked', label: 'Facts checked on', type: 'date' }
  ];
  const venuePhotos = [
    { name: 'photos_official', label: 'Photos', type: 'photos', hint: 'First photo is the cover. Paste image links from the official website or upload your own.' },
    { name: 'photo_source', label: 'Page the photos came from', type: 'url' }
  ];
  const seo = { name: 'focus_keyword', label: 'Focus keyword (SEO)', type: 'text', hint: 'e.g. “best hotels in belek”' };
  const schema = {
    hotels: {
      label: 'Hotels', singular: 'Hotel', folder: 'content/hotels', path: '/hotels/', icon: '🏨',
      fields: [
        { name: 'title', label: 'Hotel name', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'slug', hint: 'Keep it the same after publishing.' },
        { name: 'neighborhood', label: 'Area', type: 'select', options: AREAS, allowCustom: true },
        { name: 'district_slug', label: 'District', type: 'select', options: DISTRICTS },
        { name: 'category', label: 'Style', type: 'select', options: ['City hotel', 'Boutique & heritage', 'Coastal resort', 'Golf resort'] },
        { name: 'tags', label: 'Badges', type: 'tags', options: ['editors-choice', 'sponsored'] },
        { name: 'tagline', label: 'Tagline', type: 'text' },
        { name: 'excerpt', label: 'Short description (cards & Google)', type: 'textarea', max: 160 },
        ...venuePhotos,
        { name: 'amenities', label: 'Highlights / amenities', type: 'list', hint: 'One per line: Private beach, Kids club, Spa…' },
        { name: 'booking_url', label: 'Booking / affiliate link', type: 'url' },
        { name: 'map_lat', label: 'Map latitude', type: 'number' },
        { name: 'map_lng', label: 'Map longitude', type: 'number' },
        { name: 'booking_note', label: 'Good to know before booking', type: 'textarea' },
        ...source, seo,
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    },
    restaurants: {
      label: 'Restaurants', singular: 'Restaurant', folder: 'content/restaurants', path: '/restaurants/', icon: '🍽️',
      fields: [
        { name: 'title', label: 'Restaurant name', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'slug' },
        { name: 'neighborhood', label: 'Area / street', type: 'text' },
        { name: 'district_slug', label: 'District', type: 'select', options: DISTRICTS },
        { name: 'category', label: 'Cuisine', type: 'text', hint: 'e.g. Seafood and meze' },
        { name: 'tags', label: 'Badges', type: 'tags', options: ['editors-choice', 'sponsored'] },
        { name: 'tagline', label: 'Tagline', type: 'text' },
        { name: 'excerpt', label: 'Short description', type: 'textarea', max: 160 },
        ...venuePhotos,
        { name: 'signature_dishes', label: 'Dishes to try', type: 'list' },
        { name: 'booking_url', label: 'Reservation link', type: 'url' },
        { name: 'map_lat', label: 'Map latitude', type: 'number' },
        { name: 'map_lng', label: 'Map longitude', type: 'number' },
        { name: 'booking_note', label: 'Booking tips', type: 'textarea' },
        { name: 'status_note', label: 'Closure / notice (shown on the card)', type: 'textarea' },
        ...source, seo,
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    },
    golf: {
      label: 'Golf', singular: 'Golf club', folder: 'content/golf', path: '/golf/', icon: '⛳',
      fields: [
        { name: 'title', label: 'Club name', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'slug' },
        { name: 'neighborhood', label: 'Area', type: 'text' },
        { name: 'district_slug', label: 'District', type: 'select', options: DISTRICTS },
        { name: 'category', label: 'Type', type: 'text' },
        { name: 'tagline', label: 'Tagline', type: 'text' },
        { name: 'excerpt', label: 'Short description', type: 'textarea', max: 160 },
        ...venuePhotos,
        { name: 'booking_note', label: 'Before booking a round', type: 'textarea' },
        ...source, seo,
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    },
    events: {
      label: 'Events', singular: 'Event', folder: 'content/events', path: '/events/', icon: '🎟️',
      fields: [
        { name: 'title', label: 'Event name', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'slug' },
        { name: 'category', label: 'Category', type: 'text', hint: 'Concerts, Theatre, Festivals, Family, Sports…' },
        { name: 'start_date', label: 'Start date', type: 'date' },
        { name: 'end_date', label: 'End date (optional)', type: 'date' },
        { name: 'time_display', label: 'Time', type: 'text', hint: 'e.g. 20:30' },
        { name: 'date_verified', label: 'Date confirmed on the organiser’s page', type: 'bool' },
        { name: 'venue', label: 'Venue', type: 'text' },
        { name: 'neighborhood', label: 'Area', type: 'text' },
        { name: 'district_slug', label: 'District', type: 'select', options: DISTRICTS },
        { name: 'ticket_url', label: 'Ticket link', type: 'url' },
        { name: 'source_url', label: 'Source page', type: 'url' },
        { name: 'source_name', label: 'Source name', type: 'text', hint: 'e.g. Biletix' },
        { name: 'admission_note', label: 'Entry conditions', type: 'textarea' },
        { name: 'excerpt', label: 'Short description', type: 'textarea', max: 160 },
        { name: 'last_checked', label: 'Checked on', type: 'date' },
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    },
    'things-to-do': {
      label: 'Things to do', singular: 'Place', folder: 'content/things-to-do', path: '/things-to-do/', icon: '🏛️',
      fields: [
        { name: 'title', label: 'Name', type: 'text', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Ancient Ruins', 'Nature', 'Beaches', 'Adventure', 'Old Town', 'Museums', 'Parks & Gardens', 'Tours'], allowCustom: true },
        { name: 'tagline', label: 'Tagline', type: 'text' },
        { name: 'excerpt', label: 'Short description', type: 'textarea', max: 160 },
        { name: 'photo_id', label: 'Cover photo (library ID)', type: 'photoId' },
        { name: 'district_slug', label: 'District', type: 'select', options: DISTRICTS },
        { name: 'map_lat', label: 'Map latitude', type: 'number' },
        { name: 'map_lng', label: 'Map longitude', type: 'number' },
        { name: 'featured', label: 'Top pick', type: 'bool' },
        seo,
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    },
    blog: {
      label: 'Blog', singular: 'Post', folder: 'content/blog', path: '/blog/', icon: '✍️',
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'slug', label: 'URL slug', type: 'slug' },
        { name: 'category', label: 'Category', type: 'select', options: ['Weather', 'Travel guide', 'Things to do', 'Beaches', 'Food', 'History', 'Culture', 'Practical', 'Families', 'Hotels'], allowCustom: true },
        { name: 'date', label: 'Publish date', type: 'date' },
        { name: 'date_display', label: 'Date as shown', type: 'text', hint: 'e.g. November 9, 2026' },
        { name: 'excerpt', label: 'Short description (cards & Google)', type: 'textarea', max: 160 },
        seo,
        { name: 'photo_id', label: 'Cover photo (library ID)', type: 'photoId' },
        { name: 'inline_photos', label: 'Photos inside the article (library IDs)', type: 'photoIds' },
        { name: 'featured', label: 'Featured', type: 'bool' },
        { name: 'body', label: 'Article', type: 'markdown' }
      ]
    }
  };
  if (typeof module !== 'undefined') module.exports = schema;
  root.ADMIN_SCHEMA = schema;
})(typeof window !== 'undefined' ? window : globalThis);
