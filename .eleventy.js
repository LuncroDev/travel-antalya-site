module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("ads.txt");
  eleventyConfig.addPassthroughCopy("index.html");

  eleventyConfig.addFilter("slugify", function (str) {
    return String(str)
      .toLowerCase()
      .replace(/[çğıöşü]/g, (c) => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[c]))
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  });

  eleventyConfig.addCollection("hotels", function (collectionApi) {
    return collectionApi.getFilteredByGlob("content/hotels/*.md").sort((a, b) => {
      return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  eleventyConfig.addCollection("restaurants", function (collectionApi) {
    return collectionApi.getFilteredByGlob("content/restaurants/*.md").sort((a, b) => {
      return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi.getFilteredByGlob("content/blog/*.md").sort((a, b) => {
      return new Date(b.data.date) - new Date(a.data.date);
    });
  });

  eleventyConfig.addCollection("thingsToDo", function (collectionApi) {
    const matched = collectionApi.getFilteredByGlob("content/things-to-do/*.md");
    console.log("DEBUG thingsToDo matched:", matched.length, JSON.stringify(matched.map((m) => m.inputPath)));
    return matched.sort((a, b) => {
      return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  eleventyConfig.addCollection("events", function (collectionApi) {
    const matched = collectionApi.getFilteredByGlob("content/events/*.md");
    console.log("DEBUG events matched:", matched.length, JSON.stringify(matched.map((m) => m.inputPath)));
    return matched.sort((a, b) => {
      return new Date(a.data.start_date) - new Date(b.data.start_date);
    });
  });

  eleventyConfig.addCollection("eventCategories", function (collectionApi) {
    const events = collectionApi.getFilteredByGlob("content/events/*.md");
    const cats = {};
    events.forEach((e) => {
      const c = e.data.category;
      if (!c) return;
      if (!cats[c]) cats[c] = [];
      cats[c].push(e);
    });
    return Object.keys(cats).map((name) => {
      const catEvents = cats[name];
      const hasMedia = catEvents.some((e) => {
        return !!e.data.video || (Array.isArray(e.data.photos) && e.data.photos.length > 0);
      });
      return { name: name, events: catEvents, hasMedia: hasMedia };
    });
  });

  eleventyConfig.addCollection("deals", function (collectionApi) {
    return collectionApi.getFilteredByGlob("content/deals/*.md").sort((a, b) => {
      return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  eleventyConfig.addCollection("featuredDeals", function (collectionApi) {
    const deals = collectionApi.getFilteredByGlob("content/deals/*.md");
    return deals.filter((d) => !!d.data.featured);
  });

  eleventyConfig.addCollection("dealCategoriesWithCounts", function (collectionApi) {
    const cats = collectionApi.getFilteredByGlob("content/deal-categories/*.md").sort((a, b) => {
      return (a.data.order || 99) - (b.data.order || 99);
    });
    const deals = collectionApi.getFilteredByGlob("content/deals/*.md");
    return cats.map((cat) => {
      const catDeals = deals.filter((d) => d.data.category === cat.data.slug);
      return { data: cat.data, deals: catDeals };
    });
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
