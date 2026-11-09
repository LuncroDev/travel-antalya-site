// Main navigation and mega-menu content. Each item opens a panel with
// grouped links on the left and two photo features on the right.
module.exports = {
  utility: [
    { label: 'Blog', href: '/blog/' },
    { label: 'Destinations', href: '/destinations/' },
    { label: 'Plan your trip', href: '/plan-your-trip/' },
    { label: 'Contact', href: '/contact/' }
  ],
  main: [
    {
      label: 'Explore', href: '/things-to-do/', icon: 'compass',
      groups: [
        { title: 'Things to do', href: '/things-to-do/', links: [
          { label: 'Kaleiçi Old Town', href: '/things-to-do/kaleici-old-town/' },
          { label: 'Aspendos Theatre', href: '/things-to-do/aspendos-theatre/' },
          { label: 'Perge Ancient City', href: '/things-to-do/perge-ancient-city/' },
          { label: 'Düden Waterfalls', href: '/things-to-do/duden-waterfalls/' },
          { label: 'Konyaaltı Beach', href: '/things-to-do/konyaalti-beach/' },
          { label: 'Köprülü Canyon', href: '/things-to-do/koprulu-canyon/' }
        ] },
        { title: 'Nature & history', href: '/things-to-do/', links: [
          { label: 'Termessos', href: '/things-to-do/termessos/' },
          { label: 'Side Ancient City', href: '/things-to-do/side-ancient-city/' },
          { label: 'Manavgat Waterfall', href: '/things-to-do/manavgat-waterfall/' },
          { label: 'Olympos & the Chimaera', href: '/things-to-do/olympos-and-the-chimaera-flames/' },
          { label: 'Tahtalı cable car', href: '/things-to-do/tahtali-olympos-cable-car/' },
          { label: 'Antalya Museum', href: '/things-to-do/antalya-museum/' }
        ] },
        { title: 'Plan your trip', href: '/plan-your-trip/', links: [
          { label: 'Getting around', href: '/plan-your-trip/#getting-around' },
          { label: 'Itineraries', href: '/plan-your-trip/#itineraries' },
          { label: 'Weather by month', href: '/blog/antalya-weather-by-months-what-to-expect-before-you-visit/' },
          { label: 'Travel blog', href: '/blog/' }
        ] }
      ],
      features: [
        { photo: 'kaputas-beach', title: 'Turquoise coves worth the drive', href: '/blog/kaputas-beach-travel-antalya/' },
        { photo: 'aspendos-theatre', title: 'A Roman stage that still sings', href: '/things-to-do/aspendos-theatre/' }
      ]
    },
    {
      label: 'Destinations', href: '/destinations/', icon: 'map',
      groups: [
        { title: 'On the coast', href: '/destinations/', links: [
          { label: 'Antalya city & Kaleiçi', href: '/destinations/muratpasa/' },
          { label: 'Konyaaltı', href: '/destinations/konyaalti/' },
          { label: 'Belek', href: '/destinations/serik/' },
          { label: 'Side & Manavgat', href: '/destinations/manavgat/' },
          { label: 'Alanya', href: '/destinations/alanya/' },
          { label: 'Kemer', href: '/destinations/kemer/' },
          { label: 'Kaş & Kalkan', href: '/destinations/kas/' }
        ] },
        { title: 'History & highlands', href: '/destinations/', links: [
          { label: 'Aksu (Perge)', href: '/destinations/aksu/' },
          { label: 'Demre', href: '/destinations/demre/' },
          { label: 'Döşemealtı', href: '/destinations/dosemealti/' },
          { label: 'Elmalı', href: '/destinations/elmali/' },
          { label: 'All 19 districts', href: '/destinations/' }
        ] }
      ],
      features: [
        { photo: 'kas-harbour', title: 'Kaş: slow days, blue water', href: '/destinations/kas/' },
        { photo: 'alanya-castle', title: 'Alanya’s castle peninsula', href: '/destinations/alanya/' }
      ]
    },
    {
      label: 'Places To Stay', href: '/hotels/', icon: 'bed',
      groups: [
        { title: 'By area', href: '/hotels/', links: [
          { label: 'Antalya city', href: '/hotels/?area=Antalya%20city' },
          { label: 'Kaleiçi', href: '/hotels/?area=Kalei%C3%A7i' },
          { label: 'Konyaaltı', href: '/hotels/?area=Konyaalt%C4%B1' },
          { label: 'Lara & Kundu', href: '/hotels/?area=Lara%20%26%20Kundu' },
          { label: 'Belek', href: '/hotels/?area=Belek' },
          { label: 'Kemer', href: '/hotels/?area=Kemer' },
          { label: 'Side', href: '/hotels/?area=Side' },
          { label: 'Alanya', href: '/hotels/?area=Alanya' }
        ] },
        { title: 'By style', href: '/hotels/', links: [
          { label: 'Coastal resorts', href: '/hotels/?type=Coastal%20resort' },
          { label: 'Golf resorts', href: '/hotels/?type=Golf%20resort' },
          { label: 'Boutique & heritage', href: '/hotels/?type=Boutique%20%26%20heritage' },
          { label: 'City hotels', href: '/hotels/?type=City%20hotel' },
          { label: 'All 100 hotels', href: '/hotels/' }
        ] }
      ],
      features: [
        { photo: 'rixos-belek-2015-1', title: 'Belek’s big resorts', href: '/hotels/?area=Belek' },
        { photo: 'kaleici-marina', title: 'Sleep inside the old walls', href: '/hotels/?area=Kalei%C3%A7i' }
      ]
    },
    {
      label: 'Eat & Drink', href: '/restaurants/', icon: 'food',
      groups: [
        { title: 'Restaurants', href: '/restaurants/', links: [
          { label: 'All restaurants', href: '/restaurants/' },
          { label: 'Seafood & meze', href: '/restaurants/?q=seafood' },
          { label: 'Traditional Turkish', href: '/restaurants/?q=turkish' },
          { label: 'Regional Antalya dishes', href: '/restaurants/?q=regional' },
          { label: 'Vegan & vegetarian', href: '/restaurants/?q=vegan' }
        ] },
        { title: 'Where to eat', href: '/restaurants/', links: [
          { label: 'Kaleiçi', href: '/restaurants/?q=kaleici' },
          { label: 'Lara', href: '/restaurants/?q=lara' },
          { label: 'Side', href: '/restaurants/?q=side' },
          { label: 'Kaş & Kalkan', href: '/restaurants/?q=kas' },
          { label: 'Alanya', href: '/restaurants/?q=alanya' }
        ] }
      ],
      features: [
        { photo: 'kalkan-harbour', title: 'Harbour tables at sunset', href: '/restaurants/?q=kalkan' },
        { photo: 'kas-harbour', title: 'Meze nights in Kaş', href: '/restaurants/?q=kas' }
      ]
    },
    {
      label: 'Events', href: '/events/', icon: 'calendar',
      groups: [
        { title: 'What’s on', href: '/events/', links: [
          { label: 'All events', href: '/events/' },
          { label: 'Concerts', href: '/events/category/concerts/' },
          { label: 'Theatre', href: '/events/category/theatre/' },
          { label: 'Festivals', href: '/events/category/festivals/' },
          { label: 'Comedy', href: '/events/category/comedy/' }
        ] },
        { title: 'More', href: '/events/', links: [
          { label: 'Family', href: '/events/category/family/' },
          { label: 'Sports', href: '/events/category/sports/' },
          { label: 'Cultural', href: '/events/category/cultural/' },
          { label: 'Nightlife', href: '/events/category/nightlife/' }
        ] }
      ],
      features: [
        { photo: 'aspendos-entrance', title: 'Opera under the stars', href: '/things-to-do/aspendos-theatre/' },
        { photo: 'side-theatre', title: 'Culture by the sea', href: '/events/category/cultural/' }
      ]
    },
    {
      label: 'Golf', href: '/golf/', icon: 'golf',
      groups: [
        { title: 'Golf in Belek', href: '/golf/', links: [
          { label: 'All golf courses', href: '/golf/' },
          { label: 'Carya Golf Club', href: '/golf/carya-golf-club/' },
          { label: 'Montgomerie Maxx Royal', href: '/golf/montgomerie-maxx-royal-golf-club/' },
          { label: 'Gloria Golf Club', href: '/golf/gloria-golf-club/' },
          { label: 'National Golf Club', href: '/golf/national-golf-club/' }
        ] },
        { title: 'Plan a golf trip', href: '/golf/', links: [
          { label: 'Golf resorts', href: '/hotels/?type=Golf%20resort' },
          { label: 'Belek guide', href: '/destinations/serik/' }
        ] }
      ],
      features: [
        { photo: 'regnum-carya-golf-2022', title: 'Fairways by the pines', href: '/golf/' },
        { photo: 'nobilis-golf', title: 'Build a stay around your round', href: '/hotels/?type=Golf%20resort' }
      ]
    }
  ]
};
